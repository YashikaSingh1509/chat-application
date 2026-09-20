import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Create a new user with hashed password and uniqueness validation
   */
  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const { email, password, name, profileImage } = createUserDto;

    // Check if user with same email already exists
    const existingUser = await this.userModel.findOne({
      email: email.toLowerCase().trim(),
    });
    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    try {
      // Hash password with bcrypt before persisting
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const newUser = new this.userModel({
        name,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        profileImage: profileImage || null,
        isOnline: false,
      });

      const savedUser = await newUser.save();
      const result = savedUser.toObject();
      delete result.password;
      return result;
    } catch (error: any) {
      if (error.code === 11000) {
        throw new ConflictException('A user with this email already exists');
      }
      throw new InternalServerErrorException(
        error.message || 'Error occurred while creating user',
      );
    }
  }

  /**
   * Retrieve all users (passwords excluded by schema select: false)
   */
  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  /**
   * Retrieve a user by MongoDB ObjectId
   */
  async findById(id: string): Promise<User> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(`Invalid user ID format: ${id}`);
    }

    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    return user;
  }

  /**
   * Find user by email (internal helper, can optionally select password for auth verification)
   */
  async findByEmail(
    email: string,
    includePassword = false,
  ): Promise<UserDocument | null> {
    const query = this.userModel.findOne({ email: email.toLowerCase().trim() });
    if (includePassword) {
      query.select('+password');
    }
    return query.exec();
  }

  /**
   * Update user details
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(`Invalid user ID format: ${id}`);
    }

    // If updating password, hash it
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    return updatedUser;
  }

  /**
   * Update user online status
   */
  async updateOnlineStatus(id: string, isOnline: boolean): Promise<User> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(`Invalid user ID format: ${id}`);
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, { isOnline }, { new: true })
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    return updatedUser;
  }
}

