import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { FormDialog } from '@/components/common/FormDialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { studentApi, type StudentBulkRow } from '@/api/studentApi';
import { useClassList } from '@/hooks/useClassList';
import { STUDENT_STATUS_TONE } from '@/lib/constants';
import { getErrorMessage } from '@/lib/errors';
import { isValidSmsPhone } from '@/lib/smsTemplate';
import type { ClassSummary } from '@/types/class';
import type { StudentStatus } from '@/types/student';

const COLUMNS = ['이름', '반', '상태', '학교', '학년', '연락처'];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

interface PreviewRow {
  cells: string[];
  body: StudentBulkRow | null;
  error: string | null;
}

// 엑셀 복사는 탭, CSV는 쉼표로 구분한다. 열 순서: 이름, 반, 상태, 학교, 학년, 연락처, 등록일자(선택)
// ponytail: 따옴표로 감싼 CSV 칸 안의 쉼표는 지원하지 않음, 필요해지면 CSV 파서로 교체
function parseRows(text: string, classes: ClassSummary[]): PreviewRow[] {
  const classIdByName = new Map(classes.map((item) => [item.name, item.id]));
  const lines = text.split(/\r?\n/).filter((line) => line.trim());

  return lines
    .map((line) => line.split(line.includes('\t') ? '\t' : ',').map((cell) => cell.trim()))
    .filter((cells, index) => !(index === 0 && cells[0] === '이름'))
    .map((cells) => {
      const [name = '', className = '', rawStatus = '', school = '', grade = '', parentPhone = '', rawDate = ''] = cells;
      const status = (rawStatus || '재원') as StudentStatus;
      const enrolledAt = rawDate.replace(/[./]/g, '-') || null;
      const classId = className ? classIdByName.get(className) : null;

      let error: string | null = null;
      if (!name || !school || !grade || !parentPhone) error = '이름·학교·학년·연락처는 필수입니다.';
      else if (!Object.hasOwn(STUDENT_STATUS_TONE, status)) error = '상태는 재원·휴원·퇴원 중 하나여야 합니다.';
      else if (classId === undefined) error = `없는 반입니다: ${className}`;
      else if (!isValidSmsPhone(parentPhone)) error = '연락처 형식이 올바르지 않습니다.';
      else if (enrolledAt && !DATE_PATTERN.test(enrolledAt)) error = '등록일자는 YYYY-MM-DD 형식이어야 합니다.';

      return {
        cells: [name, className, status, school, grade, parentPhone],
        body: error ? null : { name, classId: classId ?? null, status, school, grade, parentPhone, enrolledAt },
        error,
      };
    });
}

interface StudentBulkImportModalProps {
  onClose: () => void;
  onImported: () => void;
}

export function StudentBulkImportModal({ onClose, onImported }: StudentBulkImportModalProps) {
  const { classes } = useClassList();
  const [text, setText] = useState('');
  // 서버에서 실패한 행: 미리보기 행 번호 → 사유
  const [serverErrors, setServerErrors] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const rows = useMemo(() => parseRows(text, classes), [text, classes]);
  const validRows = rows
    .map((row, index) => ({ ...row, index }))
    .filter((row) => row.body && !serverErrors[row.index]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const result = await studentApi.bulkCreate(validRows.map((row) => row.body as StudentBulkRow));
      if (result.createdCount > 0) {
        toast.success(`${result.createdCount}명이 등록되었습니다.`);
        onImported();
      }
      if (result.failedRows.length === 0) {
        onClose();
        return;
      }
      // 실패한 행만 남겨서 고친 뒤 다시 등록할 수 있게 한다 (성공한 행이 중복 등록되지 않도록)
      const failed = result.failedRows.map((item) => ({ ...validRows[item.rowIndex], reason: item.reason }));
      setText(failed.map((row) => [...row.cells, row.body?.enrolledAt ?? ''].join('\t')).join('\n'));
      setServerErrors(Object.fromEntries(failed.map((row, index) => [index, row.reason])));
      toast.error(`${failed.length}명은 등록하지 못했습니다. 사유를 확인해주세요.`);
    } catch (e) {
      toast.error(getErrorMessage(e, '학생을 일괄 등록하지 못했습니다.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="학생 일괄 등록"
      description="엑셀/CSV 표를 복사해 아래에 붙여넣으세요."
      size="lg"
      primary={{
        label: `${validRows.length}명 일괄등록`,
        onClick: handleSubmit,
        loading: submitting,
        disabled: validRows.length === 0,
      }}
    >
      <div className="flex flex-col gap-4">
        <Textarea
          aria-label="학생 표 붙여넣기"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setServerErrors({});
          }}
          placeholder={'이름\t반\t상태\t학교\t학년\t연락처\t등록일자(선택)\n홍길동\tBasic A\t재원\t한빛초\t5\t010-0000-0000\t2025-03-02'}
          className="max-h-48 min-h-28 font-mono text-xs"
        />

        {rows.length > 0 && (
          <div>
            <p className="mb-2 text-sm text-muted-foreground">
              미리보기 · 전체 {rows.length}명 중 {validRows.length}명 등록 가능
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  {COLUMNS.map((column) => (
                    <TableHead key={column}>{column}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, index) => {
                  const error = row.error ?? serverErrors[index];
                  return [
                    <TableRow key={index} className={error ? 'bg-destructive/5 text-destructive' : undefined}>
                      {row.cells.map((cell, cellIndex) => (
                        <TableCell key={cellIndex}>{cell || '-'}</TableCell>
                      ))}
                    </TableRow>,
                    error && (
                      <TableRow key={`${index}-error`} className="bg-destructive/5">
                        <TableCell colSpan={COLUMNS.length} className="pt-0 text-xs text-destructive">
                          {error}
                        </TableCell>
                      </TableRow>
                    ),
                  ];
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </FormDialog>
  );
}
