import { describe, expect, it } from "vitest";
import {
  RESERVED_SLUGS,
  buildFinalUrl,
  cn,
  normalizeSlug,
  randomSlug,
  validateDestination,
  validateSlug,
} from "./utils";
import type { Utm } from "./types";

const NO_UTM: Utm = {
  source: "",
  medium: "",
  campaign: "",
  term: "",
  content: "",
};

describe("normalizeSlug", () => {
  it("lowercases", () => {
    expect(normalizeSlug("Summer-Sale")).toBe("summer-sale");
  });

  it("turns whitespace runs into a single hyphen", () => {
    expect(normalizeSlug("summer   sale")).toBe("summer-sale");
    expect(normalizeSlug("summer\tsale")).toBe("summer-sale");
  });

  it("leaves an already-valid slug untouched", () => {
    expect(normalizeSlug("creator-drop-02")).toBe("creator-drop-02");
  });
});

describe("validateDestination", () => {
  it("stays silent while the field is empty", () => {
    // Empty fields show no error until touched.
    expect(validateDestination("")).toBeNull();
    expect(validateDestination("   ")).toBeNull();
  });

  it("accepts full http and https URLs", () => {
    expect(validateDestination("https://example.com")).toBeNull();
    expect(validateDestination("http://example.com")).toBeNull();
    expect(
      validateDestination("https://shop.acme.com/drop-02?variant=3"),
    ).toBeNull();
  });

  it("accepts an uppercase scheme", () => {
    expect(validateDestination("HTTPS://example.com")).toBeNull();
  });

  it("trims before validating", () => {
    expect(validateDestination("  https://example.com  ")).toBeNull();
  });

  it("rejects a URL with no scheme", () => {
    expect(validateDestination("example.com")).toBe(
      "Enter a full URL including https://",
    );
  });

  it("rejects a URL with no dot-suffix", () => {
    expect(validateDestination("https://localhost")).toBe(
      "Enter a full URL including https://",
    );
  });

  it("rejects a scheme other than http(s)", () => {
    expect(validateDestination("ftp://example.com")).toBe(
      "Enter a full URL including https://",
    );
  });

  it("rejects embedded whitespace", () => {
    expect(validateDestination("https://example.com and more")).toBe(
      "Enter a full URL including https://",
    );
  });
});

describe("validateSlug", () => {
  it("stays silent while the field is empty", () => {
    expect(validateSlug("")).toBeNull();
    expect(validateSlug("   ")).toBeNull();
  });

  it("accepts lowercase letters, digits and hyphens", () => {
    expect(validateSlug("summer-sale")).toBeNull();
    expect(validateSlug("spring-24")).toBeNull();
    expect(validateSlug("promo")).toBeNull();
  });

  it.each(RESERVED_SLUGS)("reserves %s for Klip", (slug) => {
    expect(validateSlug(slug)).toBe("That path is reserved by Klip.");
  });

  it("says nothing about whether a slug is already taken", () => {
    // That is a database question — see checkSlugAvailability in
    // src/links/actions.ts. This function stays pure.
    expect(validateSlug("summer-sale")).toBeNull();
  });

  it("rejects a slug with no letter or number", () => {
    // normalizeSlug maps whitespace to hyphens, so this is what a spaces-only
    // input actually becomes.
    expect(validateSlug("-")).toBe("Use at least one letter or number.");
    expect(validateSlug("---")).toBe("Use at least one letter or number.");
    expect(validateSlug(normalizeSlug("   "))).toBe(
      "Use at least one letter or number.",
    );
  });

  it("rejects characters outside the allowed set", () => {
    const message = "Use lowercase letters, numbers and hyphens only.";
    expect(validateSlug("Summer")).toBe(message);
    expect(validateSlug("summer_sale")).toBe(message);
    expect(validateSlug("summer sale")).toBe(message);
    expect(validateSlug("summer/sale")).toBe(message);
  });

  it("matches the reserved list case-sensitively", () => {
    // "Admin" never reaches the reserved list — it fails the charset rule
    // first. In the UI normalizeSlug lowercases before this runs, but the
    // function's own contract is what a server-side caller will rely on.
    expect(validateSlug("Admin")).toBe(
      "Use lowercase letters, numbers and hyphens only.",
    );
    expect(validateSlug(normalizeSlug("Admin"))).toBe(
      "That path is reserved by Klip.",
    );
  });
});

describe("buildFinalUrl", () => {
  it("returns the destination untouched when no UTM is set", () => {
    expect(buildFinalUrl("https://example.com/product", NO_UTM)).toBe(
      "https://example.com/product",
    );
  });

  it("ignores whitespace-only UTM values", () => {
    expect(
      buildFinalUrl("https://example.com", { ...NO_UTM, source: "   " }),
    ).toBe("https://example.com");
  });

  it("appends every populated parameter in order", () => {
    expect(
      buildFinalUrl("https://example.com", {
        source: "instagram",
        medium: "social",
        campaign: "summer-sale",
        term: "shoes",
        content: "video-01",
      }),
    ).toBe(
      "https://example.com?utm_source=instagram&utm_medium=social&utm_campaign=summer-sale&utm_term=shoes&utm_content=video-01",
    );
  });

  it("appends only the populated subset", () => {
    expect(
      buildFinalUrl("https://example.com", {
        ...NO_UTM,
        source: "instagram",
        content: "video-01",
      }),
    ).toBe("https://example.com?utm_source=instagram&utm_content=video-01");
  });

  it("joins with & when the destination already has a query string", () => {
    expect(
      buildFinalUrl("https://example.com/p?variant=3", {
        ...NO_UTM,
        source: "instagram",
      }),
    ).toBe("https://example.com/p?variant=3&utm_source=instagram");
  });

  it("encodes values that are not URL-safe", () => {
    expect(
      buildFinalUrl("https://example.com", {
        ...NO_UTM,
        campaign: "summer sale & more",
      }),
    ).toBe("https://example.com?utm_campaign=summer+sale+%26+more");
  });
});

describe("randomSlug", () => {
  it("always produces a slug that passes validation", () => {
    for (let i = 0; i < 50; i++) {
      expect(validateSlug(randomSlug())).toBeNull();
    }
  });
});

describe("cn", () => {
  it("joins truthy class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("drops falsy entries", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });

  it("returns an empty string when everything is falsy", () => {
    expect(cn(false, undefined)).toBe("");
  });
});
