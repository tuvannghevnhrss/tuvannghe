/** Tạo file demo (CV giả lập + JD) vào docs/m3-v2-demo/ để thử upload. Chạy: pnpm m3:demo-files */
import fs from "node:fs";
import path from "node:path";
import { FIXTURES } from "../tests/m3/fixtures";
import { makeDocx, makePdf } from "../tests/m3/helpers";

const dir = path.join("docs", "m3-v2-demo");
fs.mkdirSync(dir, { recursive: true });

const vi = FIXTURES.find((f) => f.id === "01-hr-high-match")!;
const en = FIXTURES.find((f) => f.id === "14-senior-technical")!;
const weak = FIXTURES.find((f) => f.id === "04-no-metrics")!;
const inj = FIXTURES.find((f) => f.id === "18-injection-cv")!;

fs.writeFileSync(path.join(dir, "demo-cv-tuyen-dung-vi.docx"), makeDocx(vi.cv.split("\n")));
fs.writeFileSync(path.join(dir, "demo-cv-senior-backend-en.pdf"), makePdf(en.cv));
fs.writeFileSync(path.join(dir, "demo-cv-marketing-thieu-so-lieu.docx"), makeDocx(weak.cv.split("\n")));
fs.writeFileSync(path.join(dir, "demo-cv-co-prompt-injection.docx"), makeDocx(inj.cv.split("\n")));
fs.writeFileSync(path.join(dir, "demo-jd-chuyen-vien-tuyen-dung.txt"), `${vi.jobTitle}\n\n${vi.jd}\n`);
fs.writeFileSync(path.join(dir, "demo-jd-senior-backend-en.txt"), `${en.jobTitle}\n\n${en.jd}\n`);
fs.writeFileSync(path.join(dir, "demo-jd-marketing-digital.txt"), `${weak.jobTitle}\n\n${weak.jd}\n`);
console.log("Đã tạo file demo trong", dir);
