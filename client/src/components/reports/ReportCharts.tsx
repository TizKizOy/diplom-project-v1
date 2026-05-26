'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const COLORS = ['#1a56db', '#16a34a', '#dc2626', '#f59e0b', '#64748b'];

type CourseListenersRow = { name: string; listeners: number };

type AttemptStatusRow = {
  name: string;
  pending: number;
  accepted: number;
  rejected: number;
  rework: number;
};

export function CoursesListenersChart({ data }: { data: CourseListenersRow[] }) {
  if (data.length === 0) return null;
  const sorted = [...data].sort((a, b) => b.listeners - a.listeners).slice(0, 12);

  return (
    <div style={{ width: '100%', height: 320 }}>
      <ResponsiveContainer>
        <BarChart data={sorted} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="name"
            width={200}
            tick={{ fontSize: 11 }}
          />
          <Tooltip labelStyle={{ fontWeight: 600 }} />
          <Bar dataKey="listeners" name="Слушатели" fill="#1a56db" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AttemptsStatusPieChart({ data }: { data: AttemptStatusRow[] }) {
  const totals = data.reduce(
    (acc, r) => ({
      pending: acc.pending + r.pending,
      accepted: acc.accepted + r.accepted,
      rejected: acc.rejected + r.rejected,
      rework: acc.rework + r.rework,
    }),
    { pending: 0, accepted: 0, rejected: 0, rework: 0 },
  );
  const pieData = [
    { name: 'На проверке', value: totals.pending, color: '#f59e0b' },
    { name: 'Принято', value: totals.accepted, color: '#16a34a' },
    { name: 'Отклонено', value: totals.rejected, color: '#dc2626' },
    { name: 'На доработке', value: totals.rework, color: '#1a56db' },
  ].filter((d) => d.value > 0);

  if (pieData.length === 0) return null;

  return (
    <div style={{ width: '100%', height: 320 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={110}
            label={({ name, percent }) =>
              `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
            }
          >
            {pieData.map((entry, i) => (
              <Cell key={entry.name} fill={entry.color ?? COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AttemptsByCourseChart({ data }: { data: AttemptStatusRow[] }) {
  if (data.length === 0) return null;
  const top = [...data].sort((a, b) => b.pending + b.accepted - (a.pending + a.accepted)).slice(0, 8);

  return (
    <div style={{ width: '100%', height: 340 }}>
      <ResponsiveContainer>
        <BarChart data={top} margin={{ left: 4, right: 16, top: 8, bottom: 48 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-18} textAnchor="end" height={70} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="accepted" name="Принято" stackId="s" fill="#16a34a" />
          <Bar dataKey="pending" name="На проверке" stackId="s" fill="#f59e0b" />
          <Bar dataKey="rework" name="Доработка" stackId="s" fill="#1a56db" />
          <Bar dataKey="rejected" name="Отклонено" stackId="s" fill="#dc2626" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
