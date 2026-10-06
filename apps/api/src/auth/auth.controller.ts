import {
  Body,
  Controller,
  Get,
  Post,
  Res,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../common/decorators/current-user.decorator.js";
import { AuthGuard } from "../common/guards/auth.guard.js";
import type { AuthenticatedUser } from "../common/guards/auth.guard.js";
import { AuthService } from "./auth.service.js";
import { LoginDto } from "./dto/login.dto.js";
import { RegisterDto } from "./dto/register.dto.js";
import { SessionTokenService } from "./session-token.service.js";

type HeaderResponse = {
  setHeader(name: string, value: string): void;
};

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: SessionTokenService,
  ) {}

  @Post("register")
  register(@Body() input: RegisterDto) {
    return this.authService.register(input);
  }

  @Post("login")
  async login(
    @Body() input: LoginDto,
    @Res({ passthrough: true }) response: HeaderResponse,
  ) {
    const result = await this.authService.login(input);

    response.setHeader(
      "Set-Cookie",
      this.tokenService.createSessionCookie(result.accessToken),
    );

    return {
      user: result.user,
    };
  }

  @Post("logout")
  logout(@Res({ passthrough: true }) response: HeaderResponse) {
    response.setHeader(
      "Set-Cookie",
      this.tokenService.createClearSessionCookie(),
    );

    return {
      message: "Signed out successfully.",
    };
  }

  @Get("me")
  @UseGuards(AuthGuard)
  getCurrentUser(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }
}
