import { Injectable } from '@nestjs/common';

@Injectable()
export class AdminRepository {
  async isEmailExist(..._args: any[]): Promise<any> {
    return null;
  }

  async create(..._args: any[]): Promise<any> {
    return null;
  }

  async findById(..._args: any[]): Promise<any> {
    return null;
  }

  async findByIdWithRole(..._args: any[]): Promise<any> {
    return null;
  }

  async update(..._args: any[]): Promise<any> {
    return null;
  }
}

@Injectable()
export class RoleRepository {
  async findById(..._args: any[]): Promise<any> {
    return null;
  }
}

@Injectable()
export class StaticPageRepository {
  async findById(..._args: any[]): Promise<any> {
    return null;
  }
}

@Injectable()
export class VersionRepository {
  async findById(..._args: any[]): Promise<any> {
    return null;
  }
}

