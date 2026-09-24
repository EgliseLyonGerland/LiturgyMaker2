import { beforeEach, expect, it, vi } from "vitest";

import migrate from "..";
import version2 from "../version2";
import version3 from "../version3";
import version4 from "../version4";
import version5 from "../version5";
import version6 from "../version6";
import version7 from "../version7";
import version8 from "../version8";

vi.mock("../version2");
vi.mock("../version3");
vi.mock("../version4");
vi.mock("../version5");
vi.mock("../version6");
vi.mock("../version7");
vi.mock("../version8");

beforeEach(() => {
  vi.clearAllMocks();

  version2.mockImplementation((value) => value);
  version3.mockImplementation((value) => value);
  version4.mockImplementation((value) => value);
  version5.mockImplementation((value) => value);
  version6.mockImplementation((value) => value);
  version7.mockImplementation((value) => value);
  version8.mockImplementation((value) => value);
});

it("migrate() from version 1", () => {
  const result = migrate({ version: 1, blocks: [] });

  expect(result).toEqual({ version: 9, blocks: [] });
  expect(version2).toHaveBeenCalledTimes(1);
  expect(version3).toHaveBeenCalledTimes(1);
  expect(version4).toHaveBeenCalledTimes(1);
  expect(version5).toHaveBeenCalledTimes(1);
  expect(version6).toHaveBeenCalledTimes(1);
  expect(version7).toHaveBeenCalledTimes(1);
  expect(version8).toHaveBeenCalledTimes(1);
});

it("migrate() from version 5", () => {
  const result = migrate({ version: 5, blocks: [] });

  expect(result).toEqual({ version: 9, blocks: [] });
  expect(version2).not.toHaveBeenCalled();
  expect(version3).not.toHaveBeenCalled();
  expect(version4).not.toHaveBeenCalled();
  expect(version5).not.toHaveBeenCalled();
  expect(version6).toHaveBeenCalledTimes(1);
  expect(version7).toHaveBeenCalledTimes(1);
  expect(version8).toHaveBeenCalledTimes(1);
});

it("migrate() from version 7", () => {
  const result = migrate({ version: 999, blocks: [] });

  expect(result).toEqual({ version: 999, blocks: [] });
  expect(version2).not.toHaveBeenCalled();
  expect(version3).not.toHaveBeenCalled();
  expect(version4).not.toHaveBeenCalled();
  expect(version5).not.toHaveBeenCalled();
  expect(version6).not.toHaveBeenCalled();
  expect(version7).not.toHaveBeenCalled();
  expect(version8).not.toHaveBeenCalled();
});
