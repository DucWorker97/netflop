import { IsEmail, IsString, Matches, MinLength } from 'class-validator';
import {
    MIN_PASSWORD_LENGTH,
    PASSWORD_POLICY_MESSAGE,
    PASSWORD_POLICY_REGEX,
} from '../../common/utils/security';

export class RegisterDto {
    @IsEmail()
    email!: string;

    @IsString()
    @MinLength(MIN_PASSWORD_LENGTH)
    @Matches(PASSWORD_POLICY_REGEX, { message: PASSWORD_POLICY_MESSAGE })
    password!: string;
}
