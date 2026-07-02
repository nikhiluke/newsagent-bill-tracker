import { useState, useMemo } from 'react';

export const useDatePicker = (startYear = 1950, endYear = new Date().getFullYear()) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-11
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Months array for the dropdown
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate years list (typically descending for birthdates)
  const years = useMemo(() => {
    const list = [];
    for (let y = endYear; y >= startYear; y--) {
      list.push(y);
    }
    return list;
  }, [startYear, endYear]);

  return {
    selectedMonth,
    selectedYear,
    setSelectedMonth,
    setSelectedYear,
    months,
    years,
  };
};
