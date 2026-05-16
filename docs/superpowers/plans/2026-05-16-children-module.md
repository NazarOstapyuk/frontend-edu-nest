# Children (Учні) Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fully functional Учні (Children) page with create, edit, and delete operations, following the same patterns as the existing Users and Groups modules.

**Architecture:** API types and functions in `shared/api/children.ts`, Zustand store in `pages/children/model/childrenStore.ts`, three UI components (page + two modals) in `pages/children/ui/`. The route is already stubbed in the router and the sidebar nav item already exists.

**Tech Stack:** React, TypeScript, MUI v6, Zustand, react-hook-form + yup, axios.

---

### Task 1: API layer — `src/shared/api/children.ts`

**Files:**
- Create: `src/shared/api/children.ts`
- Modify: `src/shared/api/index.ts`

- [ ] **Create `src/shared/api/children.ts`** with the following content:

```ts
import type { User } from '../../entities/user';
import type { Group } from './groups';
import { axiosInstance } from './axiosInstance';

export interface Child {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  group: Group | null;
  parents: User[];
  createdAt: string;
}

export interface CreateChildDto {
  firstName: string;
  lastName: string;
  birthDate: string;
  groupId: string;
  parentIds: string[];
}

export interface UpdateChildDto {
  firstName: string;
  lastName: string;
  birthDate: string;
  groupId: string;
  parentIds: string[];
}

export const childrenApi = {
  getList: () =>
    axiosInstance.get<Child[]>('/children'),

  create: (dto: CreateChildDto) =>
    axiosInstance.post<Child>('/children', dto),

  update: (id: string, dto: UpdateChildDto) =>
    axiosInstance.patch<Child>(`/children/${id}`, dto),

  delete: (id: string) =>
    axiosInstance.delete(`/children/${id}`),
};
```

- [ ] **Update `src/shared/api/index.ts`** — add children exports:

```ts
export { axiosInstance } from './axiosInstance';
export { authApi } from './auth';
export { usersApi } from './users';
export type { CreateUserDto, UpdateUserDto } from './users';
export { groupsApi } from './groups';
export type { Group, CreateGroupDto, UpdateGroupDto } from './groups';
export { childrenApi } from './children';
export type { Child, CreateChildDto, UpdateChildDto } from './children';
```

- [ ] **Commit:**

```bash
git add src/shared/api/children.ts src/shared/api/index.ts
git commit -m "feat: add children API layer"
```

---

### Task 2: Zustand store — `src/pages/children/model/childrenStore.ts`

**Files:**
- Create: `src/pages/children/model/childrenStore.ts`

- [ ] **Create `src/pages/children/model/childrenStore.ts`** with the following content:

```ts
import { create } from 'zustand';
import { childrenApi, type CreateChildDto, type UpdateChildDto, type Child } from '../../../shared/api';

interface ChildrenState {
  children: Child[];
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  createChildModal: { isOpen: boolean };
  editChildModal: { isOpen: boolean; child: Child | null };
  setCreateChildModal: (value: Partial<{ isOpen: boolean }>) => void;
  setEditChildModal: (value: Partial<{ isOpen: boolean; child: Child | null }>) => void;
  fetchChildren: () => Promise<void>;
  createChild: (dto: CreateChildDto) => Promise<void>;
  updateChild: (id: string, dto: UpdateChildDto) => Promise<void>;
  deleteChild: (id: string) => Promise<void>;
}

export const useChildrenStore = create<ChildrenState>((set) => ({
  children: [],
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  createChildModal: { isOpen: false },
  editChildModal: { isOpen: false, child: null },

  setCreateChildModal: (value) =>
    set((state) => ({ createChildModal: { ...state.createChildModal, ...value } })),

  setEditChildModal: (value) =>
    set((state) => ({ editChildModal: { ...state.editChildModal, ...value } })),

  fetchChildren: async () => {
    set({ isLoading: true });
    try {
      const { data } = await childrenApi.getList();
      set({ children: data });
    } finally {
      set({ isLoading: false });
    }
  },

  createChild: async (dto) => {
    set({ isCreating: true });
    try {
      const { data } = await childrenApi.create(dto);
      set((state) => ({ children: [...state.children, data] }));
    } finally {
      set({ isCreating: false });
    }
  },

  updateChild: async (id, dto) => {
    set({ isUpdating: true });
    try {
      const { data } = await childrenApi.update(id, dto);
      set((state) => ({
        children: state.children.map((c) => (c.id === id ? data : c)),
      }));
    } finally {
      set({ isUpdating: false });
    }
  },

  deleteChild: async (id) => {
    set({ isDeleting: true });
    try {
      await childrenApi.delete(id);
      set((state) => ({ children: state.children.filter((c) => c.id !== id) }));
    } finally {
      set({ isDeleting: false });
    }
  },
}));
```

- [ ] **Commit:**

```bash
git add src/pages/children/model/childrenStore.ts
git commit -m "feat: add children Zustand store"
```

---

### Task 3: CreateChildModal

**Files:**
- Create: `src/pages/children/ui/CreateChildModal.tsx`

- [ ] **Create `src/pages/children/ui/CreateChildModal.tsx`** with the following content:

```tsx
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogTitle,
  TextField,
} from '@mui/material'
import { useChildrenStore } from '../model/childrenStore'
import { useUsersStore } from '../../users/model/usersStore'
import { useGroupsStore } from '../../groups/model/groupsStore'

const schema = yup.object({
  firstName: yup.string().min(2, 'Мінімум 2 символи').required("Обов'язкове поле"),
  lastName: yup.string().min(2, 'Мінімум 2 символи').required("Обов'язкове поле"),
  birthDate: yup.string().required("Обов'язкове поле"),
  groupId: yup.string().required("Обов'язкове поле"),
  parentIds: yup.array().of(yup.string().required()).default([]),
})

type FormValues = yup.InferType<typeof schema>

export const CreateChildModal = () => {
  const createChild = useChildrenStore((s) => s.createChild)
  const isCreating = useChildrenStore((s) => s.isCreating)
  const { isOpen } = useChildrenStore((s) => s.createChildModal)
  const setCreateChildModal = useChildrenStore((s) => s.setCreateChildModal)
  const users = useUsersStore((s) => s.users)
  const groups = useGroupsStore((s) => s.groups)

  const parents = users.filter((u) => u.role === 'parent')

  const { control, handleSubmit, reset } = useForm<FormValues>({
    mode: 'all',
    defaultValues: { firstName: '', lastName: '', birthDate: '', groupId: '', parentIds: [] },
    resolver: yupResolver(schema),
  })

  const handleClose = () => {
    reset()
    setCreateChildModal({ isOpen: false })
  }

  const onSubmit = async (values: FormValues) => {
    await createChild({
      firstName: values.firstName,
      lastName: values.lastName,
      birthDate: values.birthDate,
      groupId: values.groupId,
      parentIds: values.parentIds ?? [],
    })
    handleClose()
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>Новий учень</DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: '20px' }}>
        <Controller
          name="lastName"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              label="Прізвище"
              fullWidth
              error={!!error}
              helperText={error?.message}
            />
          )}
        />

        <Controller
          name="firstName"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              label="Ім'я"
              fullWidth
              error={!!error}
              helperText={error?.message}
            />
          )}
        />

        <Controller
          name="birthDate"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              label="Дата народження"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              error={!!error}
              helperText={error?.message}
            />
          )}
        />

        <Controller
          name="groupId"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Autocomplete
              options={groups}
              getOptionLabel={(option) => option.name}
              value={groups.find((g) => g.id === field.value) ?? null}
              onChange={(_, selected) => field.onChange(selected?.id ?? '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Група"
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />
          )}
        />

        <Controller
          name="parentIds"
          control={control}
          render={({ field }) => (
            <Autocomplete
              multiple
              options={parents}
              getOptionLabel={(option) => `${option.lastName} ${option.firstName}`}
              value={parents.filter((p) => field.value?.includes(p.id))}
              onChange={(_, selected) => field.onChange(selected.map((p) => p.id))}
              renderInput={(params) => <TextField {...params} label="Батьки" />}
            />
          )}
        />

        <Box sx={{ display: 'flex', gap: '10px' }}>
          <Button onClick={handleClose} color="inherit" sx={{ width: '100%' }}>
            Скасувати
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            variant="contained"
            disabled={isCreating}
            sx={{ width: '100%' }}
          >
            Зберегти
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}
```

- [ ] **Commit:**

```bash
git add src/pages/children/ui/CreateChildModal.tsx
git commit -m "feat: add CreateChildModal"
```

---

### Task 4: EditChildModal

**Files:**
- Create: `src/pages/children/ui/EditChildModal.tsx`

- [ ] **Create `src/pages/children/ui/EditChildModal.tsx`** with the following content:

```tsx
import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogTitle,
  TextField,
} from '@mui/material'
import { useChildrenStore } from '../model/childrenStore'
import { useUsersStore } from '../../users/model/usersStore'
import { useGroupsStore } from '../../groups/model/groupsStore'

const schema = yup.object({
  firstName: yup.string().min(2, 'Мінімум 2 символи').required("Обов'язкове поле"),
  lastName: yup.string().min(2, 'Мінімум 2 символи').required("Обов'язкове поле"),
  birthDate: yup.string().required("Обов'язкове поле"),
  groupId: yup.string().required("Обов'язкове поле"),
  parentIds: yup.array().of(yup.string().required()).default([]),
})

type FormValues = yup.InferType<typeof schema>

export const EditChildModal = () => {
  const updateChild = useChildrenStore((s) => s.updateChild)
  const isUpdating = useChildrenStore((s) => s.isUpdating)
  const { isOpen, child } = useChildrenStore((s) => s.editChildModal)
  const setEditChildModal = useChildrenStore((s) => s.setEditChildModal)
  const users = useUsersStore((s) => s.users)
  const groups = useGroupsStore((s) => s.groups)

  const parents = users.filter((u) => u.role === 'parent')

  const { control, handleSubmit, reset } = useForm<FormValues>({
    mode: 'all',
    defaultValues: { firstName: '', lastName: '', birthDate: '', groupId: '', parentIds: [] },
    resolver: yupResolver(schema),
  })

  useEffect(() => {
    if (child) {
      reset({
        firstName: child.firstName,
        lastName: child.lastName,
        birthDate: child.birthDate,
        groupId: child.group?.id ?? '',
        parentIds: child.parents.map((p) => p.id),
      })
    }
  }, [child, reset])

  const handleClose = () => {
    reset()
    setEditChildModal({ isOpen: false, child: null })
  }

  const onSubmit = async (values: FormValues) => {
    if (!child) return
    await updateChild(child.id, {
      firstName: values.firstName,
      lastName: values.lastName,
      birthDate: values.birthDate,
      groupId: values.groupId,
      parentIds: values.parentIds ?? [],
    })
    handleClose()
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>Редагувати учня</DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: '20px' }}>
        <Controller
          name="lastName"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              label="Прізвище"
              fullWidth
              error={!!error}
              helperText={error?.message}
            />
          )}
        />

        <Controller
          name="firstName"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              label="Ім'я"
              fullWidth
              error={!!error}
              helperText={error?.message}
            />
          )}
        />

        <Controller
          name="birthDate"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              label="Дата народження"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              error={!!error}
              helperText={error?.message}
            />
          )}
        />

        <Controller
          name="groupId"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Autocomplete
              options={groups}
              getOptionLabel={(option) => option.name}
              value={groups.find((g) => g.id === field.value) ?? null}
              onChange={(_, selected) => field.onChange(selected?.id ?? '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Група"
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />
          )}
        />

        <Controller
          name="parentIds"
          control={control}
          render={({ field }) => (
            <Autocomplete
              multiple
              options={parents}
              getOptionLabel={(option) => `${option.lastName} ${option.firstName}`}
              value={parents.filter((p) => field.value?.includes(p.id))}
              onChange={(_, selected) => field.onChange(selected.map((p) => p.id))}
              renderInput={(params) => <TextField {...params} label="Батьки" />}
            />
          )}
        />

        <Box sx={{ display: 'flex', gap: '10px' }}>
          <Button onClick={handleClose} color="inherit" sx={{ width: '100%' }}>
            Скасувати
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            variant="contained"
            disabled={isUpdating}
            sx={{ width: '100%' }}
          >
            Зберегти
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}
```

- [ ] **Commit:**

```bash
git add src/pages/children/ui/EditChildModal.tsx
git commit -m "feat: add EditChildModal"
```

---

### Task 5: ChildrenPage + barrel export + router wiring

**Files:**
- Create: `src/pages/children/ui/ChildrenPage.tsx`
- Create: `src/pages/children/index.ts`
- Modify: `src/app/router/index.tsx`

- [ ] **Create `src/pages/children/ui/ChildrenPage.tsx`** with the following content:

```tsx
import { useEffect } from 'react'
import {
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { useChildrenStore } from '../model/childrenStore'
import { useUsersStore } from '../../users/model/usersStore'
import { useGroupsStore } from '../../groups/model/groupsStore'
import { CreateChildModal } from './CreateChildModal'
import { EditChildModal } from './EditChildModal'

export const ChildrenPage = () => {
  const children = useChildrenStore((s) => s.children)
  const fetchChildren = useChildrenStore((s) => s.fetchChildren)
  const setCreateChildModal = useChildrenStore((s) => s.setCreateChildModal)
  const setEditChildModal = useChildrenStore((s) => s.setEditChildModal)
  const deleteChild = useChildrenStore((s) => s.deleteChild)
  const fetchUsers = useUsersStore((s) => s.fetchUsers)
  const fetchGroups = useGroupsStore((s) => s.fetchGroups)

  useEffect(() => {
    fetchChildren()
    fetchUsers()
    fetchGroups()
  }, [fetchChildren, fetchUsers, fetchGroups])

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Всього учнів: {children.length}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateChildModal({ isOpen: true })}
        >
          Створити учня
        </Button>
      </Box>

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
              <TableCell>#</TableCell>
              <TableCell>Ім'я та прізвище</TableCell>
              <TableCell>Дата народження</TableCell>
              <TableCell>Група</TableCell>
              <TableCell>Батьки</TableCell>
              <TableCell align="right">Дії</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {children.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  Учнів ще немає. Натисніть «Створити учня».
                </TableCell>
              </TableRow>
            ) : (
              children.map((child, index) => (
                <TableRow key={child.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell sx={{ color: 'text.secondary', width: 40 }}>{index + 1}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>
                    {child.lastName} {child.firstName}
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>
                    {new Date(child.birthDate).toLocaleDateString('uk-UA')}
                  </TableCell>
                  <TableCell>
                    {child.group ? (
                      <Chip label={child.group.name} size="small" variant="outlined" />
                    ) : (
                      <Typography variant="body2" color="text.secondary">—</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {child.parents.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">—</Typography>
                      ) : (
                        child.parents.map((parent) => (
                          <Chip
                            key={parent.id}
                            label={`${parent.lastName} ${parent.firstName}`}
                            size="small"
                            variant="outlined"
                          />
                        ))
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Редагувати">
                      <IconButton
                        size="small"
                        onClick={() => setEditChildModal({ isOpen: true, child })}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Видалити">
                      <IconButton size="small" color="error" onClick={() => deleteChild(child.id)}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <CreateChildModal />
      <EditChildModal />
    </Box>
  )
}
```

- [ ] **Create `src/pages/children/index.ts`:**

```ts
export { ChildrenPage } from './ui/ChildrenPage'
```

- [ ] **Update `src/app/router/index.tsx`** — replace the `students` EmptyPage with `ChildrenPage`:

```tsx
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AdminLayout } from '../layouts/AdminLayout'
import { RequireAuth } from './RequireAuth'
import { DashboardPage } from '../../pages/dashboard'
import { UsersPage } from '../../pages/users'
import { GroupsPage } from '../../pages/groups'
import { ChildrenPage } from '../../pages/children'
import { EmptyPage } from '../../shared/ui/EmptyPage'
import { LoginPage } from '../../pages/login'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <RequireAuth />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true,       element: <DashboardPage /> },
          { path: 'users',     element: <UsersPage /> },
          { path: 'groups',    element: <GroupsPage /> },
          { path: 'students',  element: <ChildrenPage /> },
          { path: 'teachers',  element: <EmptyPage title="Вчителі" /> },
          { path: 'classes',   element: <EmptyPage title="Класи" /> },
          { path: 'schedule',  element: <EmptyPage title="Розклад" /> },
          { path: 'grades',    element: <EmptyPage title="Оцінки" /> },
          { path: 'reports',   element: <EmptyPage title="Звіти" /> },
          { path: 'settings',  element: <EmptyPage title="Налаштування" /> },
          { path: '*',         element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
])
```

- [ ] **Commit:**

```bash
git add src/pages/children/ui/ChildrenPage.tsx src/pages/children/index.ts src/app/router/index.tsx
git commit -m "feat: wire up /students route with ChildrenPage"
```
