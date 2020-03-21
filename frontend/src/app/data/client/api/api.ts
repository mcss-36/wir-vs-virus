export * from './adminLoginController.service';
import { AdminLoginControllerService } from './adminLoginController.service';
export * from './basicErrorController.service';
import { BasicErrorControllerService } from './basicErrorController.service';
export * from './shopAdminController.service';
import { ShopAdminControllerService } from './shopAdminController.service';
export * from './shopController.service';
import { ShopControllerService } from './shopController.service';
export * from './shopLoginController.service';
import { ShopLoginControllerService } from './shopLoginController.service';
export const APIS = [AdminLoginControllerService, BasicErrorControllerService, ShopAdminControllerService, ShopControllerService, ShopLoginControllerService];