import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import PersonRemoveRoundedIcon from '@mui/icons-material/PersonRemoveRounded';
import AvatarPickerModal from '../components/AvatarPickerModal';
import BackupManager from '../components/BackupManager';
import { resolveAvatar } from '../components/avatars';
import useHodhodakStore from '../store/useHodhodakStore';

type DialogMode = 'class' | 'teacher' | 'student' | null;
type AvatarTarget = 'new-teacher' | 'new-student' | 'teacher' | null;

const cardStyle = {
  border: '2px solid',
  borderColor: 'divider',
  borderRadius: 4,
  p: 2,
  bgcolor: 'background.paper',
};

export default function ClassManagementView() {
  const classrooms = useHodhodakStore((state) => state.classrooms);
  const students = useHodhodakStore((state) => state.students);
  const teachers = useHodhodakStore((state) => state.teachers);
  const activeClassroomId = useHodhodakStore((state) => state.activeClassroomId);
  const activeStudentId = useHodhodakStore((state) => state.activeStudentId);
  const setActiveClass = useHodhodakStore((state) => state.setActiveClass);
  const setActiveStudent = useHodhodakStore((state) => state.setActiveStudent);
  const createClassroom = useHodhodakStore((state) => state.createClassroom);
  const createTeacher = useHodhodakStore((state) => state.createTeacher);
  const assignTeacherToClass = useHodhodakStore((state) => state.assignTeacherToClass);
  const updateTeacher = useHodhodakStore((state) => state.updateTeacher);
  const createStudent = useHodhodakStore((state) => state.createStudent);
  const addStudentToClass = useHodhodakStore((state) => state.addStudentToClass);
  const removeStudentFromClass = useHodhodakStore((state) => state.removeStudentFromClass);

  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [avatarTarget, setAvatarTarget] = useState<AvatarTarget>(null);
  const [newTeacherMode, setNewTeacherMode] = useState(false);
  const [returnToClassDialog, setReturnToClassDialog] = useState(false);
  const [className, setClassName] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [classTeacherId, setClassTeacherId] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [teacherBio, setTeacherBio] = useState('');
  const [teacherAvatar, setTeacherAvatar] = useState('preset:owl');
  const [studentName, setStudentName] = useState('');
  const [studentAvatar, setStudentAvatar] = useState('preset:hoopoe');
  const [pendingRemovalId, setPendingRemovalId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

  const currentClass = activeClassroomId ? classrooms[activeClassroomId] : undefined;
  const currentTeacher = currentClass ? teachers[currentClass.teacherId] : undefined;
  const classList = Object.values(classrooms);
  const teacherList = Object.values(teachers);
  const availableStudents = Object.values(students).filter(
    (student) => !currentClass?.studentIds.includes(student.id),
  );

  const showError = (message: string) => setNotice({ severity: 'error', message });
  const showSuccess = (message: string) => setNotice({ severity: 'success', message });

  const handleCreateClass = () => {
    if (!className.trim() || !academicYear.trim() || !teachers[classTeacherId]) {
      showError('نام کلاس، سال تحصیلی و آموزگار را وارد کنید.');
      return;
    }
    try {
      const classroom = createClassroom({
        name: className.trim(),
        gradeLevel: 1,
        academicYear: academicYear.trim(),
        teacherId: classTeacherId,
        studentIds: [],
      });
      setActiveClass(classroom.id);
      setDialogMode(null);
      showSuccess('کلاس تازه ساخته شد.');
    } catch {
      showError('ساخت کلاس انجام نشد؛ اطلاعات را دوباره بررسی کنید.');
    }
  };

  const handleCreateTeacher = () => {
    if (!teacherName.trim()) {
      showError('نام آموزگار را وارد کنید.');
      return;
    }
    try {
      const teacher = createTeacher({
        fullName: teacherName.trim(),
        bio: teacherBio.trim(),
        avatar: teacherAvatar,
      });
      if (returnToClassDialog) {
        setClassTeacherId(teacher.id);
        setReturnToClassDialog(false);
        setDialogMode('class');
        showSuccess('آموزگار ثبت شد. حالا کلاس را بسازید.');
      } else {
        if (currentClass) assignTeacherToClass(currentClass.id, teacher.id);
        setDialogMode(null);
        showSuccess('آموزگار به کلاس اختصاص یافت.');
      }
    } catch {
      showError('ثبت آموزگار انجام نشد.');
    }
  };

  const handleCreateStudent = () => {
    if (!currentClass || !studentName.trim()) {
      showError('نام دانش‌آموز را وارد کنید.');
      return;
    }
    try {
      const student = createStudent({
        fullName: studentName.trim(),
        avatar: studentAvatar,
        progress: {},
      });
      addStudentToClass(currentClass.id, student.id);
      if (!activeStudentId) setActiveStudent(student.id);
      setDialogMode(null);
      showSuccess('دانش‌آموز به کلاس اضافه شد.');
    } catch {
      showError('ثبت دانش‌آموز انجام نشد.');
    }
  };

  const avatarValue =
    avatarTarget === 'new-teacher'
      ? teacherAvatar
      : avatarTarget === 'new-student'
        ? studentAvatar
        : currentTeacher?.avatar;

  const handleSaveAvatar = (avatar: string) => {
    if (avatarTarget === 'new-teacher') setTeacherAvatar(avatar);
    if (avatarTarget === 'new-student') setStudentAvatar(avatar);
    if (avatarTarget === 'teacher' && currentTeacher) updateTeacher(currentTeacher.id, { avatar });
    setAvatarTarget(null);
  };

  const teacherAvatarDisplay = resolveAvatar(currentTeacher?.avatar);
  const studentAvatarDisplay = resolveAvatar(studentAvatar);

  return (
    <Box dir="ltr" sx={{ display: 'grid', gridTemplateColumns: '232px minmax(0, 1fr)', gap: 2, alignItems: 'start' }}>
      <Paper component="aside" dir="rtl" elevation={0} sx={{ ...cardStyle, p: 1.5 }}>
        <Typography variant="h4" sx={{ px: 1, py: 1 }}>
          کلاس‌ها
        </Typography>
        <Button
          fullWidth
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={() => {
            setClassName('');
            setAcademicYear('');
            setClassTeacherId(teacherList[0]?.id ?? '');
            setDialogMode('class');
          }}
          sx={{ minHeight: 54, mb: 1.5, px: 1 }}
        >
          ساخت کلاس
        </Button>
        <Stack spacing={1} sx={{ maxHeight: 'calc(100dvh - 305px)', overflowY: 'auto' }}>
          {classList.map((classroom) => (
            <Box
              component="button"
              type="button"
              key={classroom.id}
              onClick={() => setActiveClass(classroom.id)}
              aria-pressed={activeClassroomId === classroom.id}
              sx={{
                width: '100%',
                minHeight: 66,
                textAlign: 'right',
                p: 1.5,
                borderRadius: 2,
                border: '2px solid',
                borderColor: activeClassroomId === classroom.id ? 'primary.main' : 'divider',
                bgcolor: activeClassroomId === classroom.id ? '#FFF0E2' : 'background.paper',
                cursor: 'pointer',
                '&:focus-visible': { outline: '3px solid #1F2933' },
              }}
            >
              <Typography fontWeight={800} noWrap>{classroom.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {classroom.studentIds.length.toLocaleString('fa-IR')} دانش‌آموز
              </Typography>
            </Box>
          ))}
          {!classList.length && <Typography color="text.secondary">هنوز کلاسی ساخته نشده است.</Typography>}
        </Stack>
      </Paper>

      <Box component="section" dir="rtl" sx={{ minWidth: 0, display: 'grid', gap: 2, maxHeight: 'calc(100dvh - 178px)', overflowY: 'auto', alignContent: 'start', pr: 0.5 }}>
        {currentClass ? (
          <>
            <Paper elevation={0} sx={cardStyle}>
              <Typography variant="h4" noWrap>{currentClass.name}</Typography>
              <Typography color="text.secondary">پایهٔ اول • سال تحصیلی {currentClass.academicYear}</Typography>
            </Paper>

            <Paper elevation={0} sx={cardStyle}>
              <Typography variant="h4" sx={{ mb: 1.5 }}>آموزگار کلاس</Typography>
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
                <Button
                  onClick={() => setAvatarTarget('teacher')}
                  aria-label="تغییر تصویر آموزگار"
                  sx={{ minWidth: 60, width: 60, height: 60, p: 0, borderRadius: '50%' }}
                >
                  <Avatar src={teacherAvatarDisplay.src} sx={{ width: 58, height: 58, bgcolor: teacherAvatarDisplay.bgcolor }}>
                    {teacherAvatarDisplay.text}
                  </Avatar>
                </Button>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography noWrap fontWeight={800}>{currentTeacher?.fullName ?? 'آموزگار نامشخص'}</Typography>
                  <Typography noWrap variant="body2" color="text.secondary">{currentTeacher?.bio || 'پایهٔ اول'}</Typography>
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<EditRoundedIcon />}
                  onClick={() => {
                    setNewTeacherMode(false);
                    setReturnToClassDialog(false);
                    setTeacherName('');
                    setTeacherBio('');
                    setTeacherAvatar('preset:owl');
                    setDialogMode('teacher');
                  }}
                  sx={{ minHeight: 50, flexShrink: 0, px: 1.5 }}
                >
                  تغییر
                </Button>
              </Stack>
            </Paper>

            <Paper elevation={0} sx={cardStyle}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                <Typography variant="h4">دانش‌آموزان ({currentClass.studentIds.length.toLocaleString('fa-IR')})</Typography>
                <Button
                  variant="contained"
                  startIcon={<PersonAddRoundedIcon />}
                  onClick={() => {
                    setStudentName('');
                    setStudentAvatar('preset:hoopoe');
                    setDialogMode('student');
                  }}
                  sx={{ minHeight: 50, px: 1.5 }}
                >
                  افزودن
                </Button>
              </Stack>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.5 }}>
                {currentClass.studentIds.map((id) => {
                  const student = students[id];
                  if (!student) return null;
                  const avatar = resolveAvatar(student.avatar);
                  return (
                    <Box key={id} sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, border: '1px solid', borderColor: id === activeStudentId ? 'primary.main' : 'divider', borderRadius: 2, p: 0.75 }}>
                      <Button
                        onClick={() => setActiveStudent(id)}
                        aria-label={`انتخاب ${student.fullName}`}
                        aria-pressed={id === activeStudentId}
                        sx={{ minWidth: 0, p: 0.5, flex: 1, minHeight: 52, justifyContent: 'flex-start', gap: 1 }}
                      >
                        <Avatar src={avatar.src} sx={{ width: 42, height: 42, bgcolor: avatar.bgcolor }}>
                          {avatar.text}
                        </Avatar>
                        <Typography noWrap fontWeight={700} color="text.primary" sx={{ flex: 1, textAlign: 'right' }}>
                          {student.fullName}
                        </Typography>
                      </Button>
                      <Button
                        aria-label={`برداشتن ${student.fullName} از کلاس`}
                        onClick={() => setPendingRemovalId(id)}
                        sx={{ minWidth: 46, width: 46, height: 46, p: 0 }}
                      >
                        <PersonRemoveRoundedIcon />
                      </Button>
                    </Box>
                  );
                })}
              </Box>
              {!currentClass.studentIds.length && (
                <Typography color="text.secondary" sx={{ py: 2 }}>هنوز دانش‌آموزی ثبت نشده است.</Typography>
              )}
            </Paper>
          </>
        ) : (
          <Alert severity="info">برای مدیریت دانش‌آموزان یک کلاس را انتخاب یا ایجاد کنید.</Alert>
        )}

        <BackupManager />
      </Box>

      <Dialog open={dialogMode === 'class'} onClose={() => setDialogMode(null)} maxWidth="xs" fullWidth dir="rtl">
        <DialogTitle>ساخت کلاس پایهٔ اول</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField autoFocus label="نام کلاس" value={className} onChange={(event) => setClassName(event.target.value)} fullWidth />
            <TextField label="سال تحصیلی" value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} fullWidth placeholder="۱۴۰۵–۱۴۰۶" />
            <TextField select label="آموزگار" value={classTeacherId} onChange={(event) => setClassTeacherId(event.target.value)} fullWidth>
              {teacherList.map((teacher) => <MenuItem key={teacher.id} value={teacher.id}>{teacher.fullName}</MenuItem>)}
            </TextField>
            <Button
              variant="outlined"
              onClick={() => {
                setReturnToClassDialog(true);
                setNewTeacherMode(true);
                setTeacherName('');
                setTeacherBio('');
                setTeacherAvatar('preset:owl');
                setDialogMode('teacher');
              }}
              sx={{ minHeight: 50 }}
            >
              ثبت آموزگار تازه
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogMode(null)} sx={{ minHeight: 48 }}>انصراف</Button>
          <Button variant="contained" onClick={handleCreateClass} sx={{ minHeight: 48 }}>ساخت کلاس</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialogMode === 'teacher'} onClose={() => setDialogMode(returnToClassDialog ? 'class' : null)} maxWidth="sm" fullWidth dir="rtl">
        <DialogTitle>{returnToClassDialog ? 'ثبت آموزگار کلاس تازه' : 'انتخاب آموزگار'}</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ pt: 1 }}>
            {!returnToClassDialog && !newTeacherMode && teacherList.map((teacher) => {
              const avatar = resolveAvatar(teacher.avatar);
              return (
                <Button
                  key={teacher.id}
                  variant={currentTeacher?.id === teacher.id ? 'contained' : 'outlined'}
                  onClick={() => {
                    if (!currentClass || !assignTeacherToClass(currentClass.id, teacher.id)) return;
                    setDialogMode(null);
                    showSuccess('آموزگار کلاس تغییر کرد.');
                  }}
                  sx={{ minHeight: 64, justifyContent: 'flex-start', gap: 1.5 }}
                >
                  <Avatar src={avatar.src} sx={{ bgcolor: avatar.bgcolor }}>{avatar.text}</Avatar>
                  {teacher.fullName}
                </Button>
              );
            })}
            {newTeacherMode && (
              <Stack spacing={2}>
                <TextField autoFocus label="نام آموزگار" value={teacherName} onChange={(event) => setTeacherName(event.target.value)} fullWidth />
                <TextField label="دربارهٔ آموزگار" value={teacherBio} onChange={(event) => setTeacherBio(event.target.value)} fullWidth multiline minRows={2} />
                <Button variant="outlined" onClick={() => setAvatarTarget('new-teacher')} sx={{ minHeight: 54 }}>
                  انتخاب تصویر آموزگار
                </Button>
              </Stack>
            )}
            {!returnToClassDialog && (
              <Button variant="text" onClick={() => setNewTeacherMode(!newTeacherMode)} sx={{ minHeight: 48 }}>
                {newTeacherMode ? 'نمایش آموزگاران موجود' : 'ثبت آموزگار تازه'}
              </Button>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogMode(returnToClassDialog ? 'class' : null)} sx={{ minHeight: 48 }}>انصراف</Button>
          {newTeacherMode && <Button variant="contained" onClick={handleCreateTeacher} sx={{ minHeight: 48 }}>ثبت و اختصاص</Button>}
        </DialogActions>
      </Dialog>

      <Dialog open={dialogMode === 'student'} onClose={() => setDialogMode(null)} maxWidth="sm" fullWidth dir="rtl">
        <DialogTitle>افزودن دانش‌آموز</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography fontWeight={700}>دانش‌آموزان ثبت‌شده</Typography>
            <Box sx={{ maxHeight: 170, overflowY: 'auto', display: 'grid', gap: 1 }}>
              {availableStudents.map((student) => {
                const avatar = resolveAvatar(student.avatar);
                return (
                  <Button
                    key={student.id}
                    variant="outlined"
                    onClick={() => {
                      if (currentClass && addStudentToClass(currentClass.id, student.id)) {
                        showSuccess(`${student.fullName} به کلاس اضافه شد.`);
                      }
                    }}
                    sx={{ minHeight: 54, gap: 1.5, justifyContent: 'flex-start' }}
                  >
                    <Avatar src={avatar.src} sx={{ bgcolor: avatar.bgcolor }}>{avatar.text}</Avatar>
                    {student.fullName}
                  </Button>
                );
              })}
              {!availableStudents.length && <Typography color="text.secondary">دانش‌آموز ثبت‌شدهٔ دیگری وجود ندارد.</Typography>}
            </Box>
            <Typography fontWeight={800}>یا دانش‌آموز تازه بسازید</Typography>
            <TextField label="نام دانش‌آموز" value={studentName} onChange={(event) => setStudentName(event.target.value)} fullWidth />
            <Button variant="outlined" onClick={() => setAvatarTarget('new-student')} sx={{ minHeight: 54, gap: 1 }}>
              <Avatar src={studentAvatarDisplay.src} sx={{ width: 40, height: 40, bgcolor: studentAvatarDisplay.bgcolor }}>
                {studentAvatarDisplay.text}
              </Avatar>
              انتخاب تصویر دانش‌آموز
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogMode(null)} sx={{ minHeight: 48 }}>بستن</Button>
          <Button variant="contained" onClick={handleCreateStudent} sx={{ minHeight: 48 }}>ثبت و افزودن</Button>
        </DialogActions>
      </Dialog>

      <AvatarPickerModal
        open={avatarTarget !== null}
        onClose={() => setAvatarTarget(null)}
        currentAvatar={avatarValue}
        onSave={handleSaveAvatar}
      />
      <Dialog open={pendingRemovalId !== null} onClose={() => setPendingRemovalId(null)} maxWidth="xs" fullWidth dir="rtl">
        <DialogTitle>برداشتن از کلاس؟</DialogTitle>
        <DialogContent>
          <Typography>
            {pendingRemovalId ? students[pendingRemovalId]?.fullName : ''} از این کلاس برداشته می‌شود؛ اطلاعات دانش‌آموز حذف نمی‌شود.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPendingRemovalId(null)} sx={{ minHeight: 48 }}>انصراف</Button>
          <Button
            color="error"
            variant="contained"
            sx={{ minHeight: 48 }}
            onClick={() => {
              if (currentClass && pendingRemovalId) {
                removeStudentFromClass(currentClass.id, pendingRemovalId);
                showSuccess('دانش‌آموز از این کلاس برداشته شد.');
              }
              setPendingRemovalId(null);
            }}
          >
            برداشتن از کلاس
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={Boolean(notice)} autoHideDuration={4000} onClose={() => setNotice(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={notice?.severity ?? 'success'} onClose={() => setNotice(null)} sx={{ minWidth: 280 }}>
          {notice?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
