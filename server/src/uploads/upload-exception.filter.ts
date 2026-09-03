import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { MulterError } from 'multer';

@Catch()
export class UploadExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      return response.status(status).json(
        typeof body === 'string'
          ? { statusCode: status, message: body }
          : body,
      );
    }

    if (exception instanceof MulterError) {
      const tooLarge = exception.code === 'LIMIT_FILE_SIZE';
      const status = tooLarge
        ? HttpStatus.PAYLOAD_TOO_LARGE
        : HttpStatus.BAD_REQUEST;
      return response.status(status).json({
        statusCode: status,
        message: tooLarge
          ? 'File is too large for the current upload limit.'
          : exception.message,
      });
    }

    if (exception instanceof Error) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: exception.message || 'Invalid file upload.',
      });
    }

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Upload failed.',
    });
  }
}
