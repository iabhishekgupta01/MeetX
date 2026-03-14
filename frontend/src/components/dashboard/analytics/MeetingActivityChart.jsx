import React from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import styles from "./MeetingActivityChart.module.css";

function MeetingActivityChart({ data }) {
  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Meeting Activity (Last 7 Days)</h3>
        <p className={styles.sub}>Frequency trend</p>
      </div>

      <div className={styles.chartWrap}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 6, left: -22, bottom: 0 }}>
            <CartesianGrid stroke="rgba(122, 174, 230, 0.25)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "#d0e8ff", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fill: "#d0e8ff", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#142131",
                border: "1px solid #3f6489",
                borderRadius: "10px",
                color: "#eaf6ff",
              }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#7aaee6"
              strokeWidth={2.5}
              dot={{ fill: "#7aaee6", r: 3 }}
              activeDot={{ r: 5, fill: "#bfe1ff" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export default MeetingActivityChart;
