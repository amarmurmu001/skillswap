const fs = require('fs');

const profilePath = 'app/(app)/profile/page.js';
let s = fs.readFileSync(profilePath, 'utf8');

const mapStart = s.indexOf('{reviews.map(r => {');
const mapEnd = s.indexOf('})}', mapStart) + 3;
if (mapStart < 0) throw new Error('reviews map not found');

s =
  s.slice(0, mapStart) +
  '{reviews.map(r => (\n                <ProfileReviewItem key={r.id} review={r} />\n              ))}' +
  s.slice(mapEnd);

if (!s.includes('function ProfileReviewItem')) {
  s += [
    '',
    'function ProfileReviewItem({ review }) {',
    '  const [reviewer, setReviewer] = useState(null);',
    '  useEffect(() => {',
    '    getUserById(review.reviewerId).then(setReviewer);',
    '  }, [review.reviewerId]);',
    '  return (',
    '    <motionlessSpinner />',
    '  );',
    '}',
    '',
  ].join('\n');

  s = s.replace(
    '    <motionlessSpinner />\n  );',
    [
      '    <div style={{ padding: \'1rem\', background: \'rgba(17,17,24,0.6)\', borderRadius: \'0.875rem\', border: \'1px solid rgba(99,102,241,0.1)\' }}>',
      '      <div style={{ display: \'flex\', alignItems: \'center\', gap: \'0.625rem\', marginBottom: \'0.625rem\' }}>',
      '        {reviewer && <img src={reviewer.avatar} alt="" style={{ width: 32, height: 32, borderRadius: \'50%\', background: \'#1a1a27\' }} />}',
      '        <div>',
      '          <div style={{ fontWeight: 600, fontSize: \'0.85rem\' }}>{reviewer?.name || \'…\'}</div>',
      '          <div style={{ display: \'flex\', alignItems: \'center\', gap: \'0.5rem\' }}>',
      '            <StarRating value={review.rating} readonly size="sm" />',
      '            {review.skillTaught && <span style={{ fontSize: \'0.72rem\', color: \'#818cf8\' }}>{review.skillTaught}</span>}',
      '          </div>',
      '        </div>',
      '      </div>',
      '      {review.comment && <p style={{ color: \'#a0a0c0\', fontSize: \'0.82rem\', lineHeight: 1.5, fontStyle: \'italic\' }}>"{review.comment}"</p>}',
      '    </div>',
      '  );',
    ].join('\n')
  );
}

fs.writeFileSync(profilePath, s);
console.log('done');
