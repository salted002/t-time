/**
 * 티타임(T-Time) 운영자(platform_admins) 계정 시더
 * -----------------------------------------------------
 * 기준 문서: 03_티타임_테이블정의서_v1.2.md, claude/티타임_디렉토리구조_v1.2.md
 *
 * 운영자는 별도 가입 API가 없어 시더로만 생성합니다 (academies/users와 완전히 분리된 인증 체계).
 * 0001-demo-academy.js(데모 학원 데이터, 주기적 초기화용)와 반드시 분리해서 관리합니다 —
 * 데모 데이터를 undo/재실행할 때 운영자 계정까지 같이 지워지는 것을 막기 위함입니다.
 *
 * 실행 명령어
 *   npm run seed --workspace=apps/backend   (sequelize-cli db:seed:all)
 *
 * 되돌리기(삭제)
 *   npx sequelize-cli db:seed:undo --seed 0002-platform-admin.js
 *
 * 데모 로그인 정보
 *   운영자(platform_admins): admin@t-time.kr / Ttime1234!
 */

'use strict';

const bcrypt = require('bcrypt');
const { randomUUID } = require('crypto');

async function up(queryInterface) {
  const now = new Date();
  const passwordHash = bcrypt.hashSync('Ttime1234!', 10);

  await queryInterface.bulkInsert('platform_admins', [
    {
      id: randomUUID(),
      email: 'admin@t-time.kr',
      password_hash: passwordHash,
      created_at: now,
      updated_at: now,
    },
  ]);
}

async function down(queryInterface) {
  await queryInterface.bulkDelete('platform_admins', { email: 'admin@t-time.kr' });
}

module.exports = { up, down };
