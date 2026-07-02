import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { Calendar1, CalendarFoldIcon } from 'lucide-react-native';
import { useDatePicker } from './useDatePicker';

type IOnlyShow = 'month' | 'year' | 'both'

export default function MonthYearPicker({
    selectedMonth: initialMonth,
    selectedYear: initialYear,
    onMonthChange,
    onYearChange,
    isDark,
    onlyShow = 'both'
}: any) {
    const { selectedMonth, selectedYear, setSelectedMonth, setSelectedYear, months, years } = useDatePicker(2020, 2030);

    useEffect(() => {
        const monthIndex = months.indexOf(initialMonth);
        if (monthIndex !== -1) {
            setSelectedMonth(monthIndex);
        }
    }, [initialMonth]);

    useEffect(() => {
        if (initialYear && years.includes(initialYear)) {
            setSelectedYear(initialYear);
        }
    }, [initialYear]);

    const monthItems = months.map((month, index) => ({
        label: month,
        value: index
    }));

    const yearItems = years.map((year) => ({
        label: String(year),
        value: year
    }));

    const pickerStyles = {
        inputAndroid: {
            fontSize: 12,
            fontWeight: '900' as const,
            padding: 10,
            color: '#0f172a',
            height: 50,
            width: 120
        },
        iconContainer: {
            right: 0,
            padding: 10
        },
    };

    return (
        <View style={[styles.container, isDark && { backgroundColor: '#1e293b' }]}>
            <View style={styles.pickerRow}>
                {/* Month Picker */}
                {
                    (onlyShow === 'month' || onlyShow === 'both') && (
                        <View style={[styles.pickerWrapper]}>
                            <RNPickerSelect
                                value={selectedMonth}
                                onValueChange={(itemValue) => {
                                    if (itemValue !== null) {
                                        setSelectedMonth(itemValue);
                                        onMonthChange?.(months[itemValue]);
                                    }
                                }}
                                items={monthItems}
                                style={pickerStyles}
                                useNativeAndroidPickerStyle={false}
                                Icon={() => <Calendar1 size={30} color={'#0284c7'} />}
                                pickerProps={{
                                    mode: 'dropdown',
                                }}
                            />

                        </View>
                    )
                }

                {/* Year Picker */}
                {
                    (onlyShow == 'year' || onlyShow == 'both') && (
                        <View style={[styles.pickerWrapper, { maxWidth: 120 }]}>
                            <RNPickerSelect
                                value={selectedYear}
                                onValueChange={(itemValue) => {
                                    if (itemValue !== null) {
                                        setSelectedYear(itemValue);
                                        onYearChange?.(itemValue);
                                    }
                                }}
                                items={yearItems}
                                style={{
                                    ...pickerStyles,
                                    inputAndroid: {
                                        ...pickerStyles.inputAndroid,
                                        width: 100
                                    }
                                }}
                                useNativeAndroidPickerStyle={false}
                                Icon={() => <CalendarFoldIcon size={30} color={'#0284c7'} />}
                                pickerProps={{
                                    mode: 'dropdown',
                                }}
                            />
                        </View>
                    )
                }
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 8,
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingLeft: 0
    },
    pickerRow: {
        flexDirection: 'row',
        gap: 12,
    },
    pickerWrapper: {
        flex: 1,
        maxWidth: 150,
        backgroundColor: '#f8fafc', // offwhite
        borderRadius: 8,
        justifyContent: 'space-between',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 12
    },
});
