import {
  getTime24Hours,
  getTime12hours,
  getDuration,
  humanizeDateTime,
  fromNow,
  getHumanizedDuration,
} from './timeUtils';

describe('TimeUtils', () => {
  describe('getTime24Hours', () => {
    it('should return 22:01 when it is 1min passed 10 pm', () => {
      jest
        .spyOn(global.Date, 'now')
        .mockImplementationOnce(() => new Date('2019-11-18T22:01:00').valueOf());

      const actualTime = getTime24Hours();

      expect(actualTime).toEqual('22:01');
    });

    it('should return 10:01 when it is 1min passed 10 am', () => {
      jest
        .spyOn(global.Date, 'now')
        .mockImplementationOnce(() => new Date('2019-11-18T10:01:00').valueOf());

      const actualTime = getTime24Hours();

      expect(actualTime).toEqual('10:01');
    });
  });

  describe('getTime12hours', () => {
    it('should return 9:45am when it is 45 minutes passed 9am', () => {
      jest
        .spyOn(global.Date, 'now')
        .mockImplementationOnce(() => new Date('2019-11-18T09:45:00').valueOf());

      const actualTime = getTime12hours();

      expect(actualTime).toEqual('9:45am');
    });

    it('should return 9:30pm when it is 30 minutes passed 9', () => {
      jest
        .spyOn(global.Date, 'now')
        .mockImplementationOnce(() => new Date('2019-11-18T21:30:00').valueOf());

      const actualTime = getTime12hours();

      expect(actualTime).toEqual('9:30pm');
    });
  });

  describe('getDuration', () => {
    it('should return 0d 5h 300m 18000s for duration between 2021-07-16:13:00 and 2021-07-16:18:00', () => {
      const startTime = '2021-07-16:13:00';
      const endTime = '2021-07-16:18:00';
      const duration = getDuration(startTime, endTime);

      expect(duration).toEqual('0d 5h 300m 18000s');
    });
  });

  describe('humanizeDateTime', () => {
    it('should return December, 31 | 12pm from 2021-12-31 12:00:00', () => {
      const input = '2021-12-31 12:00:00';
      const expected = 'December, 31 | 12pm';
      const actual = humanizeDateTime(input);

      expect(actual).toEqual(expected);
    });

    it('should return September, 8 | 7am from 2021-09-08 07:00:00', () => {
      const input = '2021-09-08 07:00:00';
      const expected = 'September, 8 | 7am';
      const actual = humanizeDateTime(input);

      expect(actual).toEqual(expected);
    });
  });

  describe('fromNow', () => {
    it('should return in 3 months from 2021-12-31 12:00:00', () => {
      // mock the date so that fromNow returns 3 months
      // if this is not done, this test will fail for future runs
      jest.spyOn(Date, 'now').mockImplementation(() => new Date('2021-09-31 12:00:00').valueOf());

      const input = '2021-12-31 12:00:00';
      const expected = 'in 3 months';
      const actual = fromNow(input);

      expect(actual).toEqual(expected);
    });
  });

  describe('getHumanizedDuration', () => {
    it('should return 2 Hours from startDate of 2021-12-31 09:00:00 and endDate of 2021-12-31 11:30:00', () => {
      const startDate = '2021-12-31 09:00:00';
      const endDate = '2021-12-31 11:00:00';
      const expected = '2 hours';
      const actual = getHumanizedDuration(startDate, endDate);

      expect(actual).toEqual(expected);
    });
  });
});
