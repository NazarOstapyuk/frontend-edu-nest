import { axiosInstance } from './axiosInstance';
import type { GroupKind } from './register';

export type NoteQuestionType = 'choice' | 'text' | 'yes_no' | 'number';

export const noteQuestionTypeLabels: Record<NoteQuestionType, string> = {
  choice: 'Вибір',
  yes_no: 'Так / ні',
  number: 'Число',
  text: 'Текст',
};

export const noteQuestionTypes = Object.keys(noteQuestionTypeLabels) as NoteQuestionType[];

export interface NoteSetQuestion {
  id: string;
  text: string;
  type: NoteQuestionType;
  required: boolean;
  options: string[];
  min: number | null;
  max: number | null;
  unit: string | null;
  active: boolean;
  sortOrder: number;
  answered: boolean;
}

export interface NoteSet {
  id: string;
  name: string;
  deadline: string;
  active: boolean;
  institution: { id: string; name: string };
  groups: { id: string; name: string }[];
  questions: NoteSetQuestion[];
}

export interface NoteQuestionDto {
  id?: string;
  text: string;
  type: NoteQuestionType;
  required?: boolean;
  options?: string[];
  min?: number | null;
  max?: number | null;
  unit?: string | null;
}

export interface CreateNoteSetDto {
  institutionId: string;
  name: string;
  deadline?: string;
  groupIds: string[];
  questions: NoteQuestionDto[];
}

export interface UpdateNoteSetDto {
  name?: string;
  deadline?: string;
  active?: boolean;
  groupIds?: string[];
  questions?: NoteQuestionDto[];
}

export interface NotesGroup {
  id: string;
  name: string;
  kind: GroupKind;
  institution: { id: string; name: string };
}

export interface NotesDayQuestion {
  id: string;
  text: string;
  type: NoteQuestionType;
  required: boolean;
  options: string[];
  min: number | null;
  max: number | null;
  unit: string | null;
}

export interface NotesDaySet {
  id: string;
  name: string;
  deadline: string;
  overdue: boolean;
  questions: NotesDayQuestion[];
}

export type NoteValue = string | number | boolean | null;

export interface NoteAnswer {
  questionId: string;
  questionText: string;
  questionType: NoteQuestionType;
  unit: string | null;
  value: NoteValue;
  answeredBy: { id: string; firstName: string; lastName: string };
  createdAt: string;
}

export interface NotesChildRow {
  child: { id: string; firstName: string; lastName: string; middleName: string | null };
  absent: boolean;
  expected: boolean;
  complete: boolean;
  answers: NoteAnswer[];
}

export interface NotesDay {
  date: string;
  working: boolean;
  calendarTitle: string | null;
  canEdit: boolean;
  needsReason: boolean;
  sets: NotesDaySet[];
  children: NotesChildRow[];
}

export interface SaveNotesAnswerDto {
  childId: string;
  questionId: string;
  value: NoteValue;
}

export interface SaveNotesDto {
  reason?: string;
  answers: SaveNotesAnswerDto[];
}

export interface PendingNotes {
  group: { id: string; name: string };
  own: boolean;
  pending: number;
  overdue: boolean;
}

export const noteSetsApi = {
  getList: () => axiosInstance.get<NoteSet[]>('/note-sets'),

  create: (dto: CreateNoteSetDto) => axiosInstance.post<NoteSet>('/note-sets', dto),

  update: (id: string, dto: UpdateNoteSetDto) => axiosInstance.patch<NoteSet>(`/note-sets/${id}`, dto),

  delete: (id: string) => axiosInstance.delete<{ message: string }>(`/note-sets/${id}`),
};

export const dailyNotesApi = {
  getGroups: () => axiosInstance.get<NotesGroup[]>('/daily-notes/groups'),

  getDay: (groupId: string, date: string) =>
    axiosInstance.get<NotesDay>(`/groups/${groupId}/notes/${date}`),

  saveDay: (groupId: string, date: string, dto: SaveNotesDto) =>
    axiosInstance.put<NotesDay>(`/groups/${groupId}/notes/${date}`, dto),

  getPending: () => axiosInstance.get<PendingNotes[]>('/daily-notes/pending'),
};
