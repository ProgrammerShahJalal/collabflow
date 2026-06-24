import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { CreateRequestContext, EntityManager, MikroORM } from '@mikro-orm/mongodb';
import { UsersService } from '../users/users.service';
import { Project } from '../projects/project.entity';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly em: EntityManager,
    private readonly orm: MikroORM,
  ) {}

  @CreateRequestContext()
  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET') ?? 'dev-access-secret',
      });

      const user = await this.usersService.findByIdOrFail(payload.sub).catch(() => null);
      if (!user || !user.isActive) {
        client.disconnect();
        return;
      }

      client.data.user = user;
      const userId = user.id;

      // Join a room named after the user ID
      await client.join(`user:${userId}`);

      // Join rooms for all projects the user is a member of
      const userProjects = await this.em.find(Project, {
        members: user._id,
      });

      for (const project of userProjects) {
        await client.join(`project:${project.id}`);
      }

      this.logger.log(
        `Client connected: ${client.id} (User: ${userId}) joined room user:${userId} and ${userProjects.length} project rooms`,
      );
    } catch (error) {
      this.logger.error(`Connection error: ${error instanceof Error ? error : undefined}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (user) {
      this.logger.log(`Client disconnected: ${client.id} (User: ${user.id})`);
    }
  }

  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  sendToMultipleUsers(userIds: string[], event: string, data: any) {
    userIds.forEach((userId) => {
      this.sendToUser(userId, event, data);
    });
  }

  sendToProject(projectId: string, event: string, data: any) {
    this.server.to(`project:${projectId}`).emit(event, data);
  }
}
