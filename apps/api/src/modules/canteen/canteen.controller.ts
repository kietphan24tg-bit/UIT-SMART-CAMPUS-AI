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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { USER_ROLES } from '@smart-campus/shared';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

import { CanteenService } from './canteen.service';
import {
  CreateCanteenCategoryDto,
  CreateCanteenOrderDto,
  CreateCanteenProductDto,
  UpdateCanteenCategoryDto,
  UpdateCanteenProductDto,
} from './dto/canteen.dto';

@ApiTags('Canteen')
@Controller('canteen')
export class CanteenController {
  constructor(private readonly canteenService: CanteenService) {}

  @Get('catalog')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get active canteen catalog' })
  getCatalog() {
    return this.canteenService.getCatalog();
  }

  @Get('catalog/admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.CANTEEN_ADMIN, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get canteen catalog for admin management' })
  getAdminCatalog(@Query('includeInactive') includeInactive?: string) {
    return this.canteenService.getAdminCatalog(includeInactive === 'true');
  }

  @Post('orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.STUDENT, USER_ROLES.LECTURER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create canteen order' })
  createOrder(@CurrentUser('id') userId: string, @Body() dto: CreateCanteenOrderDto) {
    return this.canteenService.createOrder(userId, dto);
  }

  @Get('orders/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get canteen orders of current user' })
  listMyOrders(@CurrentUser('id') userId: string) {
    return this.canteenService.listMyOrders(userId);
  }

  @Get('orders/admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.CANTEEN_ADMIN, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get canteen order list for management/audit' })
  listAdminOrders(@CurrentUser('role') role: Role) {
    return this.canteenService.listAdminOrders(role);
  }

  @Delete('orders/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.STUDENT, USER_ROLES.LECTURER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete unpaid canteen order of current user' })
  deleteOrder(@CurrentUser('id') userId: string, @Param('id') orderId: string) {
    return this.canteenService.deleteOrder(userId, orderId);
  }

  @Delete('orders/admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete canteen order history from admin management' })
  deleteAdminOrder(@Param('id') orderId: string) {
    return this.canteenService.deleteAdminOrder(orderId);
  }

  @Patch('orders/:id/complete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.CANTEEN_ADMIN, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark paid order as completed by canteen admin' })
  completeOrder(@Param('id') orderId: string, @CurrentUser('id') actorId: string) {
    return this.canteenService.completeOrder(orderId, actorId);
  }

  @Post('orders/:id/pay')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.STUDENT, USER_ROLES.LECTURER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create MoMo checkout for canteen order' })
  createPayment(@CurrentUser('id') userId: string, @Param('id') orderId: string) {
    return this.canteenService.createMomoPayment(userId, orderId);
  }

  @Post('orders/:id/pay/sepay')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.STUDENT, USER_ROLES.LECTURER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create SePay QR checkout for canteen order' })
  createSepayPayment(@CurrentUser('id') userId: string, @Param('id') orderId: string) {
    return this.canteenService.createSepayPayment(userId, orderId);
  }

  @Post('payments/momo/webhook')
  @ApiOperation({ summary: 'Handle MoMo webhook for canteen orders' })
  handleMomoWebhook(@Body() payload: Record<string, unknown>) {
    return this.canteenService.handleMomoWebhook(payload);
  }

  @Get('payments/momo/return')
  @ApiOperation({ summary: 'Handle MoMo redirect return for canteen orders' })
  handleReturn() {
    return {
      ok: true,
      message: 'Thanh toán canteen đã xử lý. Bạn có thể quay lại ứng dụng.',
    };
  }

  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.CANTEEN_ADMIN, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create canteen category' })
  createCategory(@Body() dto: CreateCanteenCategoryDto) {
    return this.canteenService.createCategory(dto);
  }

  @Patch('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.CANTEEN_ADMIN, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update canteen category' })
  updateCategory(@Param('id') categoryId: string, @Body() dto: UpdateCanteenCategoryDto) {
    return this.canteenService.updateCategory(categoryId, dto);
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable canteen category' })
  removeCategory(@Param('id') categoryId: string) {
    return this.canteenService.removeCategory(categoryId);
  }

  @Post('products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.CANTEEN_ADMIN, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create canteen product' })
  createProduct(@Body() dto: CreateCanteenProductDto) {
    return this.canteenService.createProduct(dto);
  }

  @Patch('products/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.CANTEEN_ADMIN, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update canteen product' })
  updateProduct(@Param('id') productId: string, @Body() dto: UpdateCanteenProductDto) {
    return this.canteenService.updateProduct(productId, dto);
  }

  @Delete('products/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable canteen product' })
  removeProduct(@Param('id') productId: string) {
    return this.canteenService.removeProduct(productId);
  }
}
