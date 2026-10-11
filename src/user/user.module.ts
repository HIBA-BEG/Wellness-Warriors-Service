import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './entities/user.entity';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { OrganizerGuard } from 'src/guards/organizer.guard';
import { AccessTokenGuard } from 'src/guards/access-token.guard';
import { jwtModuleOptions } from 'src/common/jwt-options';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: jwtModuleOptions,
    }),
  ],
  controllers: [UserController],
  providers: [UserService, OrganizerGuard, AccessTokenGuard],
  exports: [MongooseModule, JwtModule, OrganizerGuard],
})
export class UserModule {}
