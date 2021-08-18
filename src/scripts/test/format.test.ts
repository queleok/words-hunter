import * as format from "../format"

test("formatTime", () => {
    expect(format.formatTime(10)).toBe("00:10");
    expect(format.formatTime(60)).toBe("01:00");
    expect(format.formatTime(90)).toBe("01:30");
    expect(format.formatTime(-3)).toBe("00:00");
});

test("formatResult", () => {
    expect(format.formatResult(0)).toBe("  0");
    expect(format.formatResult(1)).toBe("  1");
    expect(format.formatResult(10)).toBe(" 10");
    expect(format.formatResult(100)).toBe("100");
});

test("escapeMissingLetters", () => {
    let freqmap_triple_a = new Array<number>(26);
    freqmap_triple_a.fill(0);
    freqmap_triple_a[0] = 3;
    expect(format.escapeMissingLetters("", freqmap_triple_a)).toBeNull();
    expect(format.escapeMissingLetters("aaa", freqmap_triple_a)).toBeNull();
    expect(format.escapeMissingLetters("aab", freqmap_triple_a)).toBe("aa<s>b</s>");
    expect(format.escapeMissingLetters("abb", freqmap_triple_a)).toBe("a<s>bb</s>");

    let freqmap_triple_a_bq = [...freqmap_triple_a];
    freqmap_triple_a_bq[1] = 1;
    freqmap_triple_a_bq[16] = 1;
    expect(format.escapeMissingLetters("qba", freqmap_triple_a_bq)).toBeNull();
    expect(format.escapeMissingLetters("aqqba", freqmap_triple_a_bq)).toBe("aq<s>q</s>ba");
    expect(format.escapeMissingLetters("aaqqbbaa", freqmap_triple_a_bq)).toBe("aaq<s>q</s>b<s>b</s>a<s>a</s>");
});

test("esacpeRegExp", () => {
    expect(format.escapeRegExp("")).toBe("");
    expect(format.escapeRegExp("abc")).toBe("abc");
    expect(format.escapeRegExp("a$c*d")).toBe("a\\$c\\*d");
});

test("filterNonAlphabetics", () => {
    expect(format.filterNonAlphabetics("")).toBe("");
    expect(format.filterNonAlphabetics("aa")).toBe("aa");
    expect(format.filterNonAlphabetics("Aa")).toBe("Aa");
    expect(format.filterNonAlphabetics("aA")).toBe("aA");
    expect(format.filterNonAlphabetics("aBc0sx09d")).toBe("aBcsxd");
    expect(format.filterNonAlphabetics("aBc sx--d")).toBe("aBcsxd");
    expect(format.filterNonAlphabetics("*aBc")).toBe("aBc");
    expect(format.filterNonAlphabetics("abC.")).toBe("abC");
});
