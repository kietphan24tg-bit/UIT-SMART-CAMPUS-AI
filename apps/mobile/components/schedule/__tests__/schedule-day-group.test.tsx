import { render } from '@testing-library/react-native';
import { StyleSheet, Text } from 'react-native';

import {
  getScheduleDaySpacing,
  ScheduleDayGroup,
  ScheduleDayList,
} from '@/components/schedule/schedule-day-group';
import { darkTheme, lightTheme } from '@/theme';

describe('ScheduleDayGroup', () => {
  it('assigns one spacing owner to each layout relationship', () => {
    const renderItem = (item: string) => <Text>{item}</Text>;
    const spacing = getScheduleDaySpacing(lightTheme);
    const screen = render(
      <ScheduleDayList>
        <ScheduleDayGroup
          day={2}
          items={['SE101', 'SE102']}
          getItemKey={(item) => item}
          renderItem={renderItem}
        />
        <ScheduleDayGroup
          day={4}
          items={['SE103']}
          getItemKey={(item) => item}
          renderItem={renderItem}
        />
      </ScheduleDayList>,
    );

    const dayListStyle = StyleSheet.flatten(screen.getByTestId('schedule-day-list').props.style);
    const mondayStyle = StyleSheet.flatten(screen.getByTestId('schedule-day-2').props.style);
    const wednesdayStyle = StyleSheet.flatten(screen.getByTestId('schedule-day-4').props.style);
    const mondayHeadingStyle = StyleSheet.flatten(
      screen.getByTestId('schedule-day-header-2').props.style,
    );
    const wednesdayHeadingStyle = StyleSheet.flatten(
      screen.getByTestId('schedule-day-header-4').props.style,
    );
    const mondayListStyle = StyleSheet.flatten(
      screen.getByTestId('schedule-session-list-2').props.style,
    );
    const wednesdayListStyle = StyleSheet.flatten(
      screen.getByTestId('schedule-session-list-4').props.style,
    );

    expect(dayListStyle).toMatchObject({
      alignSelf: 'stretch',
      gap: spacing.daySectionGap,
      width: '100%',
    });
    expect(mondayStyle).toMatchObject({
      alignSelf: 'stretch',
      gap: spacing.dayContentGap,
      width: '100%',
    });
    expect(wednesdayStyle).toMatchObject(mondayStyle);
    expect(mondayStyle.marginTop).toBeUndefined();
    expect(mondayStyle.paddingTop).toBeUndefined();
    expect(wednesdayStyle.marginTop).toBeUndefined();
    expect(wednesdayStyle.paddingTop).toBeUndefined();
    expect(mondayHeadingStyle).toEqual(wednesdayHeadingStyle);
    expect(mondayHeadingStyle.marginBottom).toBeUndefined();
    expect(mondayHeadingStyle.paddingBottom).toBeUndefined();
    expect(mondayListStyle).toMatchObject({
      alignSelf: 'stretch',
      gap: spacing.scheduleItemGap,
      width: '100%',
    });
    expect(wednesdayListStyle).toMatchObject(mondayListStyle);
    expect(mondayListStyle.marginTop).toBeUndefined();
    expect(mondayListStyle.paddingTop).toBeUndefined();
    expect(screen.queryByTestId('schedule-session-spacer-2-1')).toBeNull();
    expect(
      StyleSheet.flatten(screen.getByTestId('schedule-session-2-0').props.style),
    ).toMatchObject({ alignSelf: 'stretch', width: '100%' });
    expect(
      StyleSheet.flatten(screen.getByTestId('schedule-session-2-1').props.style),
    ).toMatchObject({ alignSelf: 'stretch', width: '100%' });
  });

  it('keeps the same spacing tokens in light and dark mode', () => {
    expect(getScheduleDaySpacing(lightTheme)).toEqual(getScheduleDaySpacing(darkTheme));
  });

  it('omits an empty day without leaving a heading, list, or spacer in layout', () => {
    const screen = render(
      <ScheduleDayList>
        <ScheduleDayGroup
          day={6}
          items={[]}
          getItemKey={(item: string) => item}
          renderItem={(item) => <Text>{item}</Text>}
        />
      </ScheduleDayList>,
    );

    expect(screen.queryByTestId('schedule-day-6')).toBeNull();
    expect(screen.queryByTestId('schedule-day-header-6')).toBeNull();
    expect(screen.queryByTestId('schedule-session-list-6')).toBeNull();
    expect(screen.queryByTestId('schedule-session-6-0')).toBeNull();
  });
});
