const fs = require('fs');

const file = 'app/(app)/profile/[id]/page.js';
let s = fs.readFileSync(file, 'utf8');

s = s.replace(
  "import { useParams } from 'next/navigation';\nimport { useAuth }",
  "import { useParams } from 'next/navigation';\nimport { useEffect, useState } from 'react';\nimport { useAuth }"
);

const blockStart = s.indexOf('  const profile = getUserById(id);');
const blockEnd = s.indexOf('  function handleConnect()');
if (blockStart < 0 || blockEnd < 0) throw new Error('sync block not found');

const insert = fs.readFileSync('scripts/profile-id-insert.txt', 'utf8');
const notFound = fs.readFileSync('scripts/profile-id-notfound.txt', 'utf8');
const scoreBlock = `  const { score, isPerfect, iCanTeachThem, theyCanTeachMe } = currentUser
    ? scorePair(currentUser, profile)
    : { score: 0, isPerfect: false, iCanTeachThem: [], theyCanTeachMe: [] };

`;

s = s.slice(0, blockStart) + insert + notFound + scoreBlock + s.slice(blockEnd);

s = s.replace(
  /async function handleConnect[\s\S]*?^  \}/m,
  fs.readFileSync('scripts/profile-id-connect.txt', 'utf8')
);

const mapStart = s.indexOf('{reviews.map(r => {');
if (mapStart >= 0) {
  const mapEnd = s.indexOf('})}', mapStart) + 3;
  s =
    s.slice(0, mapStart) +
    '{reviews.map(r => (\n                <ProfileReviewItem key={r.id} review={r} />\n              ))}' +
    s.slice(mapEnd);
}

const reviewFn = fs.readFileSync('app/(app)/profile/page.js', 'utf8');
const fnStart = reviewFn.indexOf('function ProfileReviewItem');
if (fnStart >= 0 && !s.includes('function ProfileReviewItem')) {
  s += '\n' + reviewFn.slice(fnStart);
}

fs.writeFileSync(file, s);
console.log('done');
