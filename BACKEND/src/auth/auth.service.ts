import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type { TokenPayload } from '../common/types/authenticated-user';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { toProfile, UserProfile, User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

export interface Session {
  user: UserProfile;
  token: string;
}

/**
 * Hash de una contraseña cualquiera. Se compara contra él cuando el email no
 * existe, para que la respuesta tarde lo mismo y no revele qué emails están
 * registrados.
 */
const DUMMY_HASH =
  '$2b$12$TPWusUqtVD.MHj.ZyFwvqeFhuAqmUbxLBbn8Be50JaPbBwrU3WzTm';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: CreateUserDto): Promise<Session> {
    const user = await this.usersService.create(dto);
    return this.createSession(user);
  }

  async login(dto: LoginDto): Promise<Session> {
    const user = await this.usersService.findWithPassword(dto.email);
    const passwordMatches = await bcrypt.compare(
      dto.password,
      user?.password ?? DUMMY_HASH,
    );
    if (!user || !passwordMatches) {
      throw new UnauthorizedException('Email o contraseña incorrectos');
    }
    return this.createSession(user);
  }

  private createSession(user: User): Session {
    const content: TokenPayload = { sub: user.id, email: user.email };
    return {
      user: toProfile(user),
      token: this.jwtService.sign(content),
    };
  }
}
