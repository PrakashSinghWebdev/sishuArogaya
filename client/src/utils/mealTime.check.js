// Run: node src/utils/mealTime.check.js
import { strict as assert } from 'node:assert';
import { mealStartHour, currentMealIndex } from './mealTime.js';

assert.equal(mealStartHour('7:00 – 8:00 AM'), 7);
assert.equal(mealStartHour('12:00 – 1:00 PM'), 12);
assert.equal(mealStartHour('4:00 – 4:30 PM'), 16);
assert.equal(mealStartHour('10:30 AM'), 10.5);
assert.equal(mealStartHour('11:00 AM – 12:00 PM'), 11);
assert.equal(mealStartHour('12:00 AM'), 0);
assert.equal(mealStartHour('During night'), null);
const meals = [{ time: '7:00 – 8:00 AM' }, { time: '12:00 – 1:00 PM' }, { time: '7:00 – 8:00 PM' }, { time: 'During night' }];
const at = (h, m = 0) => new Date(2026, 0, 1, h, m);
assert.equal(currentMealIndex(meals, at(7, 30)), 0);
assert.equal(currentMealIndex(meals, at(15)), 1);
assert.equal(currentMealIndex(meals, at(23)), 2);
assert.equal(currentMealIndex(meals, at(3)), 2); // before breakfast → still last night's dinner slot
assert.equal(currentMealIndex([{ time: 'Every 2–3 hours' }], at(9)), -1);
console.log('mealTime ok');
