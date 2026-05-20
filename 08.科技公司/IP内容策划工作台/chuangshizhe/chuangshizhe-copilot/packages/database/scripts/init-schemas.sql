-- 创世者 Copilot - PostgreSQL Schema 初始化脚本
-- 用途：为 Monorepo 多产品架构创建独立的业务 Schema

-- 创建业务 Schema
CREATE SCHEMA IF NOT EXISTS ip;
CREATE SCHEMA IF NOT EXISTS edu;

-- 设置默认 search_path（方便调试）
ALTER DATABASE chuangshizhe SET search_path TO public, ip, edu;

-- 验证 Schema 创建
SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('public', 'ip', 'edu');
