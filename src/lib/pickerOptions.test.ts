import { describe, expect, it } from "vitest";
import { customerOptions, employeeOptions, supplierOptions, visaAgentOptions } from "./pickerOptions";

/**
 * What each searchable picker shows and what a search can find. A customer who
 * cannot be found by phone is a customer who cannot be sold a ticket quickly.
 */

const customer = (id: string, name: string, phone: string, extra: Record<string, unknown> = {}) => ({
  id,
  name,
  phone,
  ...extra,
});

describe("customerOptions", () => {
  it("shows the phone and makes the passport searchable", () => {
    const [option] = customerOptions([customer("c1", "Rahim Uddin", "01711111111", { passportNo: "BX0123456" })]);
    expect(option).toEqual({
      value: "c1",
      label: "Rahim Uddin",
      description: "01711111111",
      keywords: ["BX0123456"],
    });
  });

  it("leaves out an empty passport rather than matching on blank", () => {
    expect(customerOptions([customer("c1", "A", "017", { passportNo: "  " })])[0].keywords).toBeUndefined();
    expect(customerOptions([customer("c1", "A", "017", { passportNo: null })])[0].keywords).toBeUndefined();
  });

  it("sorts by name, ignoring case", () => {
    const names = customerOptions([
      customer("1", "zahid", "1"),
      customer("2", "Anika", "2"),
      customer("3", "bashir", "3"),
    ]).map((o) => o.label);
    expect(names).toEqual(["Anika", "bashir", "zahid"]);
  });

  it("keeps two customers with the same name apart", () => {
    const options = customerOptions([customer("a", "Karim", "0171"), customer("b", "Karim", "0181")]);
    expect(options.map((o) => o.value)).toEqual(["a", "b"]);
    expect(options.map((o) => o.description)).toEqual(["0171", "0181"]);
  });

  describe("with showDue", () => {
    it("shows what they owe, and keeps the phone searchable", () => {
      const [option] = customerOptions([customer("c1", "Rahim", "01711111111", { currentDue: 12500 })], {
        showDue: true,
      });
      expect(option.description).toBe("owes ৳12,500");
      expect(option.keywords).toEqual(["01711111111"]);
    });

    it("calls a negative due credit", () => {
      const [option] = customerOptions([customer("c1", "Rahim", "017", { currentDue: -300 })], { showDue: true });
      expect(option.description).toBe("credit ৳300");
    });

    it("falls back to the phone when nothing is owed", () => {
      const [option] = customerOptions([customer("c1", "Rahim", "01711111111", { currentDue: 0 })], { showDue: true });
      expect(option.description).toBe("01711111111");
      expect(option.keywords).toBeUndefined();
    });
  });
});

describe("supplierOptions", () => {
  it("shows the phone when there is one and finds the contact person", () => {
    const [option] = supplierOptions([
      { id: "s1", name: "Sky Consolidators", phone: "029999999", contactName: "Mr. Hasan" },
    ]);
    expect(option).toEqual({
      value: "s1",
      label: "Sky Consolidators",
      description: "029999999",
      keywords: ["Mr. Hasan"],
    });
  });

  it("has no second line without a phone", () => {
    expect(supplierOptions([{ id: "s1", name: "Walk-in", phone: null }])[0].description).toBeUndefined();
  });

  it("with showPayable, shows what is owed or advanced", () => {
    const options = supplierOptions(
      [
        { id: "a", name: "Alpha", phone: "01", currentPayable: 5000 },
        { id: "b", name: "Beta", phone: "02", currentPayable: -750 },
        { id: "c", name: "Gamma", phone: "03", currentPayable: 0 },
      ],
      { showPayable: true },
    );
    expect(options.map((o) => o.description)).toEqual(["owed ৳5,000", "advance ৳750", "03"]);
    expect(options[0].keywords).toEqual(["01"]);
  });
});

describe("employeeOptions and visaAgentOptions", () => {
  it("show the phone for employees", () => {
    expect(employeeOptions([{ id: "e1", name: "Nadia", phone: "01800000000" }])).toEqual([
      { value: "e1", label: "Nadia", description: "01800000000" },
    ]);
  });

  it("show the agent type and find the contact", () => {
    expect(visaAgentOptions([{ id: "v1", name: "Global Visa", type: "Embassy agent", contact: "01900000000" }])).toEqual([
      { value: "v1", label: "Global Visa", description: "Embassy agent", keywords: ["01900000000"] },
    ]);
  });
});
