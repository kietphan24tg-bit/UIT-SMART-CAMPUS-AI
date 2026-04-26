import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { USER_ROLES } from '@smart-campus/shared';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

import {
  CheckoutLibraryLoanDto,
  CreateLibraryBookDto,
  CreateLibraryCopyDto,
  CreateReservationDto,
  ListLibraryBooksQueryDto,
  UpdateLibraryBookDto,
} from './dto/create-library-book.dto';
import { LibraryService } from './library.service';

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

  @Post('admin/books')
  @Roles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create library book' })
  createBook(@Body() dto: CreateLibraryBookDto) {
    return this.libraryService.createBook(dto);
  }

  @Patch('admin/books/:id')
  @Roles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update library book' })
  updateBook(@Param('id') bookId: string, @Body() dto: UpdateLibraryBookDto) {
    return this.libraryService.updateBook(bookId, dto);
  }

  @Post('admin/books/:id/copies')
  @Roles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create library copy' })
  createCopy(@Param('id') bookId: string, @Body() dto: CreateLibraryCopyDto) {
    return this.libraryService.addCopy(bookId, dto);
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
