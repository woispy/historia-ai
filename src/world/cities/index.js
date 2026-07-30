import { createBursa } from "./bursa";
import { createIznik } from "./iznik";
import { createSogut } from "./sogut";
import { createBilecik } from "./bilecik";
import { createKonstantinopolis } from "./konstantinopolis";

export function createCities() {
  const cities = [
    createBursa(),
    createIznik(),
    createSogut(),
    createBilecik(),
    createKonstantinopolis(),
  ];

  const byId = {};
  const allIds = [];

  for (const city of cities) {
    byId[city.id] = city;
    allIds.push(city.id);
  }

  return {
    byId,
    allIds,
  };
}