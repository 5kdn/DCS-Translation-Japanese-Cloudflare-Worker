import { describe, expect, it } from 'vitest';
import { UserFacingError } from '@/errors/userFacingError';
import { ensureUserPathSafe } from '@/helpers/pathSafetyHelper';

describe('ensureUserPathSafe', () => {
  it('安全なパスは許可する', () => {
    expect(() => ensureUserPathSafe('DCSWorld/Mods/file.lua')).not.toThrow();
  });

  it('".." を含むパスは拒否する', () => {
    expect(() => ensureUserPathSafe('DCSWorld/../etc/passwd')).toThrow(UserFacingError);
  });

  it('制御文字を含むパスは拒否する', () => {
    expect(() => ensureUserPathSafe(`DCSWorld/Mods/file.lua\u0000`)).toThrow(UserFacingError);
  });

  it('絶対パスは拒否する', () => {
    expect(() => ensureUserPathSafe('/etc/passwd')).toThrow(UserFacingError);
    expect(() => ensureUserPathSafe('C:\\windows\\system32')).toThrow(UserFacingError);
  });
});
