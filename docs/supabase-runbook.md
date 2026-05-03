# Supabase 실행 순서

현재 오류 `ERROR: 42P01: relation "public.families" does not exist`는 `007_worry_resolution_platform.sql`만 단독 실행했을 때 발생합니다.

## 새 Supabase 프로젝트일 때

SQL Editor에서 아래 파일 하나만 통째로 실행하세요.

```txt
RUN_THIS_IN_SUPABASE_SQL_EDITOR.sql
```

이 파일은 `001_initial_schema.sql`부터 `007_worry_resolution_platform.sql`까지 순서대로 합친 통합 SQL입니다.

## 이미 007을 실행하다가 실패했을 때

1. 실패한 SQL 탭을 닫습니다.
2. `REPAIR_IF_PUBLIC_FAMILIES_MISSING.sql`을 실행해서 핵심 테이블 존재 여부를 확인합니다.
3. `families_table`이 null이면 `RUN_THIS_IN_SUPABASE_SQL_EDITOR.sql` 전체를 실행합니다.

## 순서대로 직접 실행할 때

```txt
001_initial_schema.sql
002_product_expansion.sql
003_unified_mvp_hardening.sql
004_150_point_product_hardening.sql
005_safety_handoff_sla.sql
006_real_life_convenience_layer.sql
007_worry_resolution_platform.sql
```

007에는 중복 policy 오류 방지를 위해 `drop policy if exists`가 포함되어 있습니다.
