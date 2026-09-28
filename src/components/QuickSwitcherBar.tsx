import { useEffect, useRef } from 'react';
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

export default function QuickSwitcherBar({ compact = false }: { compact?: boolean }) {
  const classrooms = useHodhodakStore((state) => state.classrooms);
  const students = useHodhodakStore((state) => state.students);
  const activeClassroomId = useHodhodakStore((state) => state.activeClassroomId);
  const activeStudentId = useHodhodakStore((state) => state.activeStudentId);
  const setActiveClass = useHodhodakStore((state) => state.setActiveClass);
  const setActiveStudent = useHodhodakStore((state) => state.setActiveStudent);

  const currentClass = activeClassroomId ? classrooms[activeClassroomId] : undefined;
  const currentStudent = activeStudentId ? students[activeStudentId] : undefined;
  const currentAvatar = resolveAvatar(currentStudent?.avatar);
  const selectedStudentRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (compact) {
      selectedStudentRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    }
  }, [activeStudentId, activeClassroomId, compact]);

  return (
    <Box
      component="nav"
      aria-label="تغییر سریع کلاس و دانش‌آموز"
      dir="rtl"
      sx={{
        display: 'flex',
        alignItems: 'center',
        flexDirection: compact ? 'column' : 'row',
        gap: compact ? 1 : 1.5,
        px: compact ? 1 : 2,
        py: compact ? 1 : 0,
        height: compact ? 148 : 76,
        borderTop: '1px solid',
        borderColor: 'divider',
        minWidth: 0,
        bgcolor: 'background.paper',
      }}
    >
      <Box
        sx={{ display: compact ? 'flex' : 'contents', width: compact ? '100%' : undefined, gap: 1, minWidth: 0 }}
      >
        <FormControl
          size="medium"
          sx={{ width: compact ? 'auto' : 210, flex: compact ? '1 1 0' : '0 0 auto', minWidth: 0 }}
        >
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
          aria-live="polite"
          sx={{
            order: compact ? 0 : 2,
            width: compact ? '45%' : 190,
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
          <Avatar
            src={currentAvatar.src}
            sx={{ width: compact ? 40 : 46, height: compact ? 40 : 46, bgcolor: currentAvatar.bgcolor, flexShrink: 0 }}
          >
            {currentAvatar.text}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography noWrap fontWeight={800} fontSize="0.85rem">
              {currentStudent?.fullName ?? 'دانش‌آموزی انتخاب نشده'}
            </Typography>
            <Typography noWrap color="text.secondary" fontSize="0.85rem">
              ⭐ {getStars(currentStudent?.progress ?? {}).toLocaleString('fa-IR')} ستاره
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box
        aria-label="دانش‌آموزان کلاس فعال"
        sx={{
          order: compact ? 0 : 1,
          flex: compact ? '0 0 auto' : 1,
          width: compact ? '100%' : 'auto',
          minWidth: 0,
          display: 'flex',
          gap: 1,
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollBehavior: 'smooth',
          scrollSnapType: 'x proximity',
          touchAction: 'pan-x',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
          py: compact ? 0 : 0.5,
          minHeight: compact ? 72 : 0,
          alignItems: 'center',
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
              ref={selected ? selectedStudentRef : undefined}
              component="button"
              type="button"
              onClick={() => setActiveStudent(id)}
              aria-label={`انتخاب ${student.fullName}`}
              aria-pressed={selected}
              sx={{
                flex: '0 0 auto',
                minWidth: compact ? 124 : 106,
                maxWidth: compact ? 154 : 136,
                height: compact ? 68 : 58,
                px: 1,
                border: selected ? '3px solid' : '2px solid',
                borderColor: selected ? 'primary.dark' : 'divider',
                borderRadius: 3,
                bgcolor: selected ? '#FFF0E2' : 'background.paper',
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
              <Avatar
                src={avatar.src}
                sx={{ width: compact && selected ? 48 : 42, height: compact && selected ? 48 : 42, bgcolor: avatar.bgcolor, flexShrink: 0 }}
              >
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
    </Box>
  );
}
