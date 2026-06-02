import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { LoginDto, SignupDto } from './dto/auth.dto';
import { JwtPayload } from './strategies/jwt.strategy';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async signup(dto: SignupDto): Promise<{ tokens: AuthTokens; user: User }> {
    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      password: dto.password,
    });
    const tokens = await this.issueTokens(user);
    return { tokens, user };
  }

  async login(dto: LoginDto): Promise<{ tokens: AuthTokens; user: User }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    const valid = await this.usersService.verifyPassword(user, dto.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    await this.usersService.setLastLogin(user);
    const tokens = await this.issueTokens(user);
    return { tokens, user };
  }

  async refresh(refreshToken: string): Promise<{ tokens: AuthTokens; user: User }> {
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token.');
    }
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    const user = await this.usersService
      .findByIdOrFail(payload.sub)
      .catch(() => null);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    const matches = await this.usersService.matchesRefreshToken(
      user,
      refreshToken,
    );
    if (!matches) {
      throw new UnauthorizedException('Refresh token has been rotated.');
    }

    const tokens = await this.issueTokens(user);
    return { tokens, user };
  }

  async logout(user: User): Promise<void> {
    await this.usersService.setRefreshTokenHash(user, null);
  }

  private async issueTokens(user: User): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.config.get<string>('JWT_SECRET') ?? 'dev-access-secret',
      expiresIn: (this.config.get<string>('JWT_EXPIRES_IN') ?? '15m') as never,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret:
        this.config.get<string>('JWT_REFRESH_SECRET') ?? 'dev-refresh-secret',
      expiresIn: (this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ??
        '7d') as never,
    });

    // Rotation: persist the hash of the latest refresh token.
    await this.usersService.setRefreshTokenHash(user, refreshToken);

    return { accessToken, refreshToken };
  }
}
