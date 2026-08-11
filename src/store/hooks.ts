import { useStore } from './useStore';

export function useCurrentStudent() {
  const currentStudentId = useStore((s) => s.currentStudentId);
  const students = useStore((s) => s.students);
  return currentStudentId ? students[currentStudentId] : null;
}
