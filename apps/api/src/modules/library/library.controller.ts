import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { LibraryLoanRequestStatus, Role } from '@prisma/client';
import { USER_ROLES } from '@smart-campus/shared';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AvatarUploadFile } from '../storage/avatar-storage.service';
import { MAX_AVATAR_UPLOAD_SIZE_BYTES } from '../storage/avatar-upload.constants';

import {
  CheckoutLibraryLoanDto,
  CreateLibraryBookDto,
  CreateLibraryCopyDto,
  CreateLibraryLoanRequestDto,
  CreateReservationDto,
  ListLibraryBooksQueryDto,
  ListLibraryLoanRequestsQueryDto,
  UpdateLibraryCopyDto,
  UpdateLibraryBookDto,
} from './dto/create-library-book.dto';
import { LibraryService } from './library.service';

const bookCoverUploadPipe = new ParseFilePipeBuilder()
  .addFileTypeValidator({
    fileType: /^(image\/jpeg|image\/jpg|image\/png|image\/webp)$/,
  })
  .addMaxSizeValidator({
    maxSize: MAX_AVATAR_UPLOAD_SIZE_BYTES,
  })
  .build({
    fileIsRequired: true,
    errorHttpStatusCode: HttpStatus.BAD_REQUEST,
  });

@ApiTags('Library')
@Controller('library')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Get('books')
  @ApiOperation({ summary: 'List books for in-app library search' })
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiQuery({ name: 'subject', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  listBooks(@Query() query: ListLibraryBooksQueryDto) {
    return this.libraryService.listBooks(query);
  }

  @Get('books/:id')
  @ApiOperation({ summary: 'Get book detail with copy inventory' })
  getBook(@Param('id') id: string) {
    return this.libraryService.getBook(id);
  }

  @Get('me/loans')
  @Roles(USER_ROLES.STUDENT, USER_ROLES.LECTURER)
  @ApiOperation({ summary: 'Get current user loan history' })
  getMyLoans(@CurrentUser('id') userId: string) {
    return this.libraryService.listMyLoans(userId);
  }

  @Get('me/loan-requests')
  @Roles(USER_ROLES.STUDENT, USER_ROLES.LECTURER)
  @ApiOperation({ summary: 'Get current user loan requests' })
  @ApiQuery({ name: 'status', required: false, enum: LibraryLoanRequestStatus })
  getMyLoanRequests(
    @CurrentUser('id') userId: string,
    @Query() query: ListLibraryLoanRequestsQueryDto,
  ) {
    return this.libraryService.listMyLoanRequests(userId, query.status);
  }

  @Post('loan-requests')
  @Roles(USER_ROLES.STUDENT, USER_ROLES.LECTURER)
  @ApiOperation({ summary: 'Create a library loan request' })
  createLoanRequest(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateLibraryLoanRequestDto,
  ) {
    return this.libraryService.createLoanRequest(userId, dto);
  }

  @Get('loan-requests/:id')
  @Roles(USER_ROLES.STUDENT, USER_ROLES.LECTURER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get library loan request detail' })
  getLoanRequest(
    @Param('id') requestId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    const isAdmin = role === Role.admin || role === Role.super_admin;
    return this.libraryService.getLoanRequest(requestId, userId, isAdmin);
  }

  @Patch('loan-requests/:id/cancel')
  @Roles(USER_ROLES.STUDENT, USER_ROLES.LECTURER)
  @ApiOperation({ summary: 'Cancel a pending library loan request' })
  cancelLoanRequest(@Param('id') requestId: string, @CurrentUser('id') userId: string) {
    return this.libraryService.cancelLoanRequest(requestId, userId);
  }

  @Delete('loan-requests/:id')
  @Roles(USER_ROLES.STUDENT, USER_ROLES.LECTURER)
  @ApiOperation({ summary: 'Delete an owned cancelled library loan request' })
  deleteLoanRequest(@Param('id') requestId: string, @CurrentUser('id') userId: string) {
    return this.libraryService.deleteLoanRequest(requestId, userId);
  }

  @Get('me/reservations')
  @Roles(USER_ROLES.STUDENT, USER_ROLES.LECTURER)
  @ApiOperation({ summary: 'Get current user reservations' })
  getMyReservations(@CurrentUser('id') userId: string) {
    return this.libraryService.listMyReservations(userId);
  }

  @Post('reservations')
  @Roles(USER_ROLES.STUDENT, USER_ROLES.LECTURER)
  @ApiOperation({ summary: 'Reserve a book' })
  createReservation(@CurrentUser('id') userId: string, @Body() dto: CreateReservationDto) {
    return this.libraryService.createReservation(userId, dto);
  }

  @Delete('reservations/:id')
  @Roles(USER_ROLES.STUDENT, USER_ROLES.LECTURER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiOperation({ summary: 'Cancel reservation by requester or admin' })
  cancelReservation(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
    @Param('id') reservationId: string,
  ) {
    const isAdmin = role === Role.admin || role === Role.super_admin;
    return this.libraryService.cancelReservation(userId, reservationId, isAdmin);
  }

  @Patch('loans/:id/renew')
  @Roles(USER_ROLES.STUDENT, USER_ROLES.LECTURER)
  @ApiOperation({ summary: 'Renew a loan by borrower policy' })
  renewLoan(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
    @Param('id') loanId: string,
  ) {
    return this.libraryService.renewLoan(userId, role, loanId);
  }

  @Delete('loans/:id')
  @Roles(USER_ROLES.STUDENT, USER_ROLES.LECTURER)
  @ApiOperation({ summary: 'Delete an owned returned loan record' })
  deleteOwnLoan(@Param('id') loanId: string, @CurrentUser('id') userId: string) {
    return this.libraryService.deleteReturnedLoan(loanId, userId, false);
  }

  @Post('admin/books')
  @Roles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create library book' })
  createBook(@Body() dto: CreateLibraryBookDto) {
    return this.libraryService.createBook(dto);
  }

  @Get('admin/books')
  @Roles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiOperation({ summary: 'List library books for admin management' })
  getAdminBooks() {
    return this.libraryService.listAdminBooks();
  }

  @Post('admin/books/cover')
  @Roles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @UseInterceptors(FileInterceptor('cover', { limits: { fileSize: MAX_AVATAR_UPLOAD_SIZE_BYTES } }))
  @ApiOperation({ summary: 'Upload library book cover image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['cover'],
      properties: {
        cover: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  uploadBookCover(
    @CurrentUser('id') actorId: string,
    @UploadedFile(bookCoverUploadPipe) file: AvatarUploadFile,
  ) {
    return this.libraryService.uploadBookCover(actorId, file);
  }

  @Patch('admin/books/:id')
  @Roles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update library book' })
  updateBook(@Param('id') bookId: string, @Body() dto: UpdateLibraryBookDto) {
    return this.libraryService.updateBook(bookId, dto);
  }

  @Delete('admin/books/:id')
  @Roles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete library book when no related data exists' })
  deleteBook(@Param('id') bookId: string) {
    return this.libraryService.deleteBook(bookId);
  }

  @Get('admin/loan-requests')
  @Roles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get library loan request queue for admin' })
  @ApiQuery({ name: 'status', required: false, enum: LibraryLoanRequestStatus })
  getAdminLoanRequests(@Query() query: ListLibraryLoanRequestsQueryDto) {
    return this.libraryService.listAdminLoanRequests(query.status);
  }

  @Patch('admin/loan-requests/:id/approve')
  @Roles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiOperation({ summary: 'Approve a pending library loan request and create loan' })
  approveLoanRequest(@Param('id') requestId: string, @CurrentUser('id') approverId: string) {
    return this.libraryService.approveLoanRequest(requestId, approverId);
  }

  @Patch('admin/loan-requests/:id/reject')
  @Roles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiOperation({ summary: 'Reject a pending library loan request' })
  rejectLoanRequest(@Param('id') requestId: string, @CurrentUser('id') approverId: string) {
    return this.libraryService.rejectLoanRequest(requestId, approverId);
  }

  @Post('admin/books/:id/copies')
  @Roles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create library copy' })
  createCopy(@Param('id') bookId: string, @Body() dto: CreateLibraryCopyDto) {
    return this.libraryService.addCopy(bookId, dto);
  }

  @Patch('admin/copies/:id')
  @Roles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update library copy metadata' })
  updateCopy(@Param('id') copyId: string, @Body() dto: UpdateLibraryCopyDto) {
    return this.libraryService.updateCopy(copyId, dto);
  }

  @Delete('admin/copies/:id')
  @Roles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete library copy when no related data exists' })
  deleteCopy(@Param('id') copyId: string) {
    return this.libraryService.deleteCopy(copyId);
  }

  @Post('admin/check-out')
  @Roles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiOperation({ summary: 'Check out copy to borrower' })
  checkout(@Body() dto: CheckoutLibraryLoanDto) {
    return this.libraryService.checkout(dto);
  }

  @Patch('admin/loans/:id/check-in')
  @Roles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiOperation({ summary: 'Check in a loan and release copy' })
  checkin(@Param('id') loanId: string, @Body('note') note?: string) {
    return this.libraryService.checkin(loanId, note);
  }

  @Get('admin/loans')
  @Roles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiOperation({ summary: 'List active library loans for admin return processing' })
  getAdminLoans() {
    return this.libraryService.listAdminLoans();
  }

  @Delete('admin/loans/:id')
  @Roles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a returned loan record' })
  deleteLoan(@Param('id') loanId: string) {
    return this.libraryService.deleteReturnedLoan(loanId, null, true);
  }

  @Patch('admin/copies/:id/mark-lost')
  @Roles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiOperation({ summary: 'Mark copy as lost' })
  markLost(@Param('id') copyId: string, @Body('conditionNote') conditionNote?: string) {
    return this.libraryService.markCopyStatus(copyId, 'lost', conditionNote);
  }

  @Patch('admin/copies/:id/mark-maintenance')
  @Roles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiOperation({ summary: 'Mark copy as maintenance' })
  markMaintenance(@Param('id') copyId: string, @Body('conditionNote') conditionNote?: string) {
    return this.libraryService.markCopyStatus(copyId, 'maintenance', conditionNote);
  }
}
