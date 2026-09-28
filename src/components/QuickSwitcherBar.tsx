import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Typography from '@mui/material/Typography';
import { resolveAvatar } from './avatars';
import useHodhodakStore from '../store/useHodhodakStore';

const getStars = (progress: Record<string, any>): number => {
  const stars = progress.stars;
  return typeof stars === 'number' && Number.isFinite(stars) ? stars : 0;
};

export default function QuickSwitcherBar() {
  const classrooms = useHodhodakStore((state) => state.classrooms);
  const students = useHodhodakStore((state) => state.students);
  const activeClassroomId = useHodhodakStore((state) => state.activeClassroomId);
  const activeStudentId = useHodhodakStore((state) => state.activeStudentId);
  const setActiveClass = useHodhodakStore((state) => state.setActiveClass);
  const setActiveStudent = useHodhodakStore((state) => state.setActiveStudent);

  const currentClass = activeClassroomId ? classrooms[activeClassroomId] : undefined;
  const currentStudent = activeStudentId ? students[activeStudentId] : undefined;
  const currentAvatar = resolveAvatar(currentStudent?.avatar);

  return (
    <Box
      component="nav"
      aria-label="تغییر سریع کلاس و دانش‌آموز"
      dir="rtl"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        height: 76,
        borderTop: '1px solid',
        borderColor: 'divider',
        minWidth: 0,
        bgcolor: 'background.paper',
      }}
    >
      <FormControl size="medium" sx={{ width: 210, flexShrink: 0 }}>
        <Select
          value={currentClass?.id ?? ''}
          onChange={(event) => setActiveClass(event.target.value || null)}
          displayEmpty
          inputProps={{ 'aria-label': 'انتخاب کلاس فعال' }}
          sx={{ height: 52, borderRadius: 3, fontWeight: 700 }}
        >
          <MenuItem value="">انتخاب کلاس</MenuItem>
          {Object.values(classrooms).map((classroom) => (
            <MenuItem key={classroom.id} value={classroom.id} sx={{ minHeight: 52 }}>
              {classroom.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box
        aria-label="دانش‌آموزان کلاس فعال"
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          gap: 1,
          overflowX: 'auto',
          scrollBehavior: 'smooth',
          scrollSnapType: 'x proximity',
          py: 0.5,
        }}
      >
        {currentClass?.studentIds.map((id) => {
          const student = students[id];
          if (!student) return null;
          const avatar = resolveAvatar(student.avatar);
          const selected = id === activeStudentId;
          return (
            <Box
              key={id}
              component="button"
              type="button"
              onClick={() => setActiveStudent(id)}
              aria-label={`انتخاب ${student.fullName}`}
              aria-pressed={selected}
              sx={{
                flex: '0 0 auto',
                minWidth: 106,
                maxWidth: 136,
                height: 58,
                px: 1,
                border: '2px solid',
                borderColor: selected ? 'primary.main' : 'divider',
                borderRadius: 3,
                bgcolor: selected ? 'primary.light' : 'background.paper',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                scrollSnapAlign: 'start',
                transition: 'background-color 160ms, border-color 160ms, transform 160ms',
                '&:hover': { transform: 'translateY(-2px)' },
                '&:focus-visible': { outline: '3px solid #1F2933', outlineOffset: 2 },
              }}
            >
              <Avatar src={avatar.src} sx={{ width: 40, height: 40, bgcolor: avatar.bgcolor }}>
                {avatar.text}
              </Avatar>
              <Typography noWrap sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                {student.fullName}
              </Typography>
            </Box>
          );
        })}
        {!currentClass?.studentIds.length && (
          <Typography color="text.secondary" sx={{ alignSelf: 'center' }}>
            دانش‌آموزی در این کلاس نیست.
          </Typography>
        )}
      </Box>

      <Box
        aria-live="polite"
        sx={{
          width: 190,
          minWidth: 0,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          borderRadius: 3,
          bgcolor: '#FFF4E8',
          p: 0.75,
        }}
      >
        <Avatar src={currentAvatar.src} sx={{ width: 46, height: 46, bgcolor: currentAvatar.bgcolor }}>
          {currentAvatar.text}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography noWrap fontWeight={800} fontSize="0.85rem">
            {currentStudent?.fullName ?? 'دانش‌آموزی انتخاب نشده'}
          </Typography>
          <Typography color="text.secondary" fontSize="0.85rem">
            ⭐ {getStars(currentStudent?.progress ?? {}).toLocaleString('fa-IR')} ستاره
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
