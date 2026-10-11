import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Types } from 'mongoose';
import { absoluteAssetUrl, requestBaseUrl } from './asset-url';

const ASSET_FIELDS = new Set(['poster', 'profilePicture']);

function rewriteAssets(
  value: unknown,
  baseUrl: string,
  seen: WeakSet<object>,
): unknown {
  if (value == null || typeof value !== 'object') {
    return value;
  }

  if (value instanceof Date) {
    return value;
  }

  if (value instanceof Types.ObjectId || (value as { _bsontype?: string })._bsontype === 'ObjectId') {
    return String(value);
  }

  if (seen.has(value)) {
    return value;
  }

  const documentValue = value as { toObject?: () => unknown };
  if (typeof documentValue.toObject === 'function') {
    return rewriteAssets(documentValue.toObject(), baseUrl, seen);
  }

  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => rewriteAssets(item, baseUrl, seen));
  }

  const output: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (key === 'password') {
      continue;
    }

    if (ASSET_FIELDS.has(key) && typeof child === 'string') {
      output[key] = absoluteAssetUrl(child, baseUrl);
      continue;
    }

    output[key] = rewriteAssets(child, baseUrl, seen);
  }

  return output;
}

@Injectable()
export class AssetUrlInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const baseUrl = requestBaseUrl(request);

    return next
      .handle()
      .pipe(map((data) => rewriteAssets(data, baseUrl, new WeakSet())));
  }
}
