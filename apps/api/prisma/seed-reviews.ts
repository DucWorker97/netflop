// @ts-nocheck
/**
 * Seed script: Create 50 users + diverse ratings & comments for Big Data analysis
 * 
 * Usage: cd apps/api && npx ts-node prisma/seed-reviews.ts
 * 
 * Generates realistic review patterns:
 * - Positive reviews (4-5 stars) with enthusiastic comments
 * - Negative reviews (1-2 stars) with critical comments
 * - Neutral reviews (3 stars) with balanced comments
 * - Some ratings without comments (star-only)
 * - Varied comment lengths (short to detailed)
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────
// USER DATA — 50 realistic Vietnamese & English users
// ─────────────────────────────────────────────────────────────
const USERS = [
    { email: 'nguyenvan.an@gmail.com', name: 'Nguyễn Văn An' },
    { email: 'tranthimai@gmail.com', name: 'Trần Thị Mai' },
    { email: 'phamhoang.duc@yahoo.com', name: 'Phạm Hoàng Đức' },
    { email: 'lethihanh@gmail.com', name: 'Lê Thị Hạnh' },
    { email: 'voquangminh@outlook.com', name: 'Võ Quang Minh' },
    { email: 'dangthiyen@gmail.com', name: 'Đặng Thị Yến' },
    { email: 'buiminhtuan@gmail.com', name: 'Bùi Minh Tuấn' },
    { email: 'ngothihuong@yahoo.com', name: 'Ngô Thị Hương' },
    { email: 'hoangvanthanh@gmail.com', name: 'Hoàng Văn Thành' },
    { email: 'doanthiphuong@gmail.com', name: 'Đoàn Thị Phương' },
    { email: 'john.smith42@gmail.com', name: 'John Smith' },
    { email: 'emily.chen@outlook.com', name: 'Emily Chen' },
    { email: 'alex.nguyen@gmail.com', name: 'Alex Nguyen' },
    { email: 'sarah.movie.fan@yahoo.com', name: 'Sarah Parker' },
    { email: 'mike.reviews@gmail.com', name: 'Mike Johnson' },
    { email: 'luna.cinephile@gmail.com', name: 'Luna Martinez' },
    { email: 'david.filmmaker@outlook.com', name: 'David Lee' },
    { email: 'anna.movie.buff@gmail.com', name: 'Anna Williams' },
    { email: 'james.critic@yahoo.com', name: 'James Brown' },
    { email: 'maria.garcia@gmail.com', name: 'Maria Garcia' },
    { email: 'truongquocbao@gmail.com', name: 'Trương Quốc Bảo' },
    { email: 'nguyenthilan@outlook.com', name: 'Nguyễn Thị Lan' },
    { email: 'phanvankhanh@gmail.com', name: 'Phan Văn Khánh' },
    { email: 'lehoangnam@yahoo.com', name: 'Lê Hoàng Nam' },
    { email: 'vuongthithuy@gmail.com', name: 'Vương Thị Thúy' },
    { email: 'cris.movie.lover@gmail.com', name: 'Chris Taylor' },
    { email: 'jennifer.w@outlook.com', name: 'Jennifer White' },
    { email: 'kevin.zhang@gmail.com', name: 'Kevin Zhang' },
    { email: 'olivia.reviews@yahoo.com', name: 'Olivia Davis' },
    { email: 'dinhvanlong@gmail.com', name: 'Đinh Văn Long' },
    { email: 'nguyenthithu@gmail.com', name: 'Nguyễn Thị Thu' },
    { email: 'tranminhduc@outlook.com', name: 'Trần Minh Đức' },
    { email: 'lythihoa@gmail.com', name: 'Lý Thị Hoa' },
    { email: 'havanson@yahoo.com', name: 'Hà Văn Sơn' },
    { email: 'rachel.kim@gmail.com', name: 'Rachel Kim' },
    { email: 'tombigfan@outlook.com', name: 'Tom Anderson' },
    { email: 'sophiaflix@gmail.com', name: 'Sophia Nguyen' },
    { email: 'daniel.movienight@yahoo.com', name: 'Daniel Park' },
    { email: 'jessica.cinefan@gmail.com', name: 'Jessica Robinson' },
    { email: 'ryan.stream@outlook.com', name: 'Ryan Thompson' },
    { email: 'caothimy@gmail.com', name: 'Cao Thị Mỹ' },
    { email: 'nguyenhaidang@yahoo.com', name: 'Nguyễn Hải Đăng' },
    { email: 'vuvanquang@gmail.com', name: 'Vũ Văn Quang' },
    { email: 'tranthihien@outlook.com', name: 'Trần Thị Hiền' },
    { email: 'phamtiendat@gmail.com', name: 'Phạm Tiến Đạt' },
    { email: 'leslie.hall@yahoo.com', name: 'Leslie Hall' },
    { email: 'brandon.wu@gmail.com', name: 'Brandon Wu' },
    { email: 'natalie.v@outlook.com', name: 'Natalie Vo' },
    { email: 'andrewcine@gmail.com', name: 'Andrew Mitchell' },
    { email: 'isabellafan@yahoo.com', name: 'Isabella Torres' },
];

// ─────────────────────────────────────────────────────────────
// COMMENT TEMPLATES — Diverse, realistic comments
// ─────────────────────────────────────────────────────────────

const POSITIVE_COMMENTS_EN = [
    "Absolutely loved this movie! The storytelling is top-notch and the acting is phenomenal.",
    "One of the best films I've seen this year. Highly recommended!",
    "Great cinematography and a compelling plot. Couldn't stop watching.",
    "Amazing performances by the entire cast. This movie deserves all the awards.",
    "A masterpiece! The direction and screenplay are brilliant.",
    "This film exceeded all my expectations. Beautiful from start to finish.",
    "Incredible emotional depth. I was moved to tears by the ending.",
    "Perfect blend of action and drama. Every scene is memorable.",
    "The visual effects are stunning and the story keeps you on the edge of your seat.",
    "Rewatched it three times already and still discover new details each time.",
    "An instant classic. This will be remembered for decades.",
    "The soundtrack alone makes this worth watching. Combined with the story, it's perfection.",
    "Finally, a movie that lives up to the hype. Outstanding in every way.",
    "The character development in this film is exceptional. You really connect with them.",
    "A thrilling ride from beginning to end. Best movie experience I've had in a while.",
    "Beautifully directed with a powerful message. Cinema at its finest.",
    "The plot twists caught me completely off guard. Brilliantly written!",
    "Every actor delivered their best performance. What a talented ensemble.",
    "This movie made me laugh, cry, and think. That's rare and precious.",
    "Gorgeous visuals paired with a deeply moving narrative. Must-watch!",
];

const POSITIVE_COMMENTS_VI = [
    "Phim quá hay! Cốt truyện hấp dẫn và diễn xuất tuyệt vời.",
    "Một trong những bộ phim hay nhất mà tôi từng xem. Rất đáng xem!",
    "Kỹ xảo đẹp mắt, nội dung sâu sắc. Xem đi xem lại không chán.",
    "Diễn viên diễn xuất quá xuất sắc. Phim xứng đáng nhận mọi giải thưởng.",
    "Kiệt tác! Đạo diễn và kịch bản đều rất tâm huyết.",
    "Phim vượt qua mọi kỳ vọng của tôi. Đẹp từ đầu đến cuối.",
    "Chiều sâu cảm xúc đáng kinh ngạc. Tôi đã khóc ở kết phim.",
    "Pha trộn hoàn hảo giữa hành động và kịch tính. Mỗi cảnh đều đáng nhớ.",
    "Phim hay lắm, cốt truyện cuốn hút, không thể rời mắt khỏi màn hình.",
    "Đã xem lại 3 lần và mỗi lần đều phát hiện thêm chi tiết mới.",
    "Nhạc phim hay tuyệt. Kết hợp với câu chuyện thì thật hoàn hảo.",
    "Phim rất đáng xem, đặc biệt là phần phát triển nhân vật.",
    "Từng cảnh quay đều rất tinh tế và chăm chút.",
    "Phim làm tôi vừa cười vừa khóc. Rất hiếm có phim nào làm được điều đó.",
    "Hình ảnh tuyệt đẹp, câu chuyện cảm động. Nhất định phải xem!",
];

const NEGATIVE_COMMENTS_EN = [
    "Very disappointing. The plot makes no sense and the acting feels forced.",
    "Wasted my time watching this. The story is predictable and boring.",
    "Terrible pacing and weak dialogue. I couldn't finish it.",
    "The worst movie I've seen in months. Nothing about it works.",
    "Overhyped and underdelivered. Save your time and skip this one.",
    "Poor writing and even worse execution. Very frustrating to watch.",
    "The plot holes are enormous. Did nobody proofread this script?",
    "Boring from start to finish. I nearly fell asleep halfway through.",
    "Great actors wasted on a terrible script. What a shame.",
    "The CGI looks cheap and the story is a mess. Really disappointing.",
    "I don't understand the positive reviews. This movie was painful to sit through.",
    "So much potential wasted. The concept was interesting but execution was awful.",
    "Confusing narrative with no payoff. Feel like my time was stolen.",
    "The dialogue is so cringeworthy. Nobody talks like that in real life.",
    "One of the most boring movies I've ever watched. Do not recommend.",
];

const NEGATIVE_COMMENTS_VI = [
    "Phim quá tệ. Cốt truyện vô lý và diễn xuất gượng gạo.",
    "Lãng phí thời gian xem phim này. Nội dung nhàm chán và dễ đoán.",
    "Tiết tấu chậm chạp, lời thoại yếu kém. Tôi không thể xem hết.",
    "Phim tệ nhất mà tôi xem trong nhiều tháng qua. Không có gì hay cả.",
    "Quảng cáo quá hay nhưng phim thì quá dở. Đừng phí thời gian.",
    "Kịch bản kém, thực hiện còn tệ hơn. Xem rất bực mình.",
    "Lỗ hổng cốt truyện quá lớn. Không ai đọc lại kịch bản à?",
    "Chán từ đầu đến cuối. Tôi suýt ngủ gật giữa chừng.",
    "Diễn viên giỏi nhưng kịch bản quá tệ. Thật đáng tiếc.",
    "Kỹ xảo rẻ tiền và nội dung lộn xộn. Rất thất vọng.",
    "Phim này có tiềm năng nhưng thực hiện quá kém. Tiếc quá!",
    "Tôi không hiểu tại sao phim này được đánh giá cao. Rất khó xem.",
];

const NEUTRAL_COMMENTS_EN = [
    "It was okay. Some good moments but nothing extraordinary.",
    "Average movie. Worth watching once but I wouldn't rewatch it.",
    "Had its moments but overall felt a bit flat. Not bad, not great.",
    "Decent entertainment but don't expect anything groundbreaking.",
    "The first half was excellent, but the second half dragged on.",
    "Good concept, mediocre execution. Could have been much better.",
    "Enjoyable but forgettable. Nice way to pass the time though.",
    "Some interesting ideas but the pacing could use improvement.",
    "The acting was solid but the story didn't fully come together for me.",
    "A mixed bag — great visuals but the plot left something to be desired.",
    "Not as good as I hoped, but not terrible either. Just... average.",
    "Entertaining enough for a weekend watch. Don't go in with high expectations.",
];

const NEUTRAL_COMMENTS_VI = [
    "Phim bình thường. Có vài cảnh hay nhưng không có gì đặc biệt.",
    "Phim tạm được. Xem một lần thì ổn nhưng không muốn xem lại.",
    "Có lúc hay lúc dở. Không tệ nhưng cũng không xuất sắc.",
    "Giải trí ổn nhưng đừng kỳ vọng quá nhiều.",
    "Nửa đầu phim rất hay, nhưng nửa sau thì kéo dài lê thê.",
    "Ý tưởng tốt nhưng thực hiện chưa tới. Có thể làm tốt hơn nhiều.",
    "Xem vui nhưng qua vài ngày là quên. Cũng ổn để giải trí cuối tuần.",
    "Diễn xuất ổn nhưng cốt truyện chưa thuyết phục lắm.",
    "Hình ảnh đẹp nhưng nội dung chưa đủ sâu. Khá trung bình.",
    "Phim xem được, không hay không dở. Giết thời gian thì ok.",
];

// ─────────────────────────────────────────────────────────────
// MAIN SEED FUNCTION
// ─────────────────────────────────────────────────────────────

function randomPick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysBack: number): Date {
    const now = Date.now();
    const past = now - daysBack * 24 * 60 * 60 * 1000;
    return new Date(past + Math.random() * (now - past));
}

async function main() {
    console.log('🌱 Seeding users and reviews for Big Data analysis...\n');

    // ────────────────────────────────────────────
    // 1. CREATE 50 USERS (idempotent via upsert)
    // ────────────────────────────────────────────
    console.log('👥 Creating 50 users...');
    const passwordHash = await bcrypt.hash('user123', 10);
    const userIds: string[] = [];

    for (const u of USERS) {
        const user = await prisma.user.upsert({
            where: { email: u.email },
            update: {},
            create: {
                email: u.email,
                passwordHash,
                role: 'viewer',
            },
        });
        userIds.push(user.id);
    }
    console.log(`✅ ${userIds.length} users ready\n`);

    // ────────────────────────────────────────────
    // 2. GET ALL PUBLISHED MOVIES
    // ────────────────────────────────────────────
    const movies = await prisma.movie.findMany({
        where: { movieStatus: 'published' },
        select: { id: true, title: true },
    });

    if (movies.length === 0) {
        console.log('⚠️  No published movies found. Run main seed first: npx prisma db seed');
        process.exit(1);
    }
    console.log(`🎬 Found ${movies.length} published movies\n`);

    // ────────────────────────────────────────────
    // 3. CLEAR EXISTING RATINGS (optional)
    // ────────────────────────────────────────────
    const existingCount = await prisma.rating.count();
    if (existingCount > 0) {
        console.log(`🧹 Clearing ${existingCount} existing ratings...`);
        await prisma.rating.deleteMany({});
    }

    // ────────────────────────────────────────────
    // 4. GENERATE RATINGS & COMMENTS
    // ────────────────────────────────────────────
    //
    // Strategy for realistic Big Data distribution:
    // - Each movie gets 8-35 reviews (varied engagement)
    // - Rating distribution varies per movie to create "good" vs "bad" movies
    // - ~30% of ratings are star-only (no comment)
    // - Comments are mixed Vietnamese & English
    // - Timestamps spread over the last 180 days
    //
    console.log('📝 Generating ratings and comments...\n');

    let totalRatings = 0;
    let totalWithComments = 0;

    for (const movie of movies) {
        // Determine movie's "quality profile" for realistic distribution
        const qualityProfile = Math.random();
        let ratingBias: 'good' | 'mixed' | 'bad';
        if (qualityProfile < 0.4) ratingBias = 'good';       // 40% of movies are generally liked
        else if (qualityProfile < 0.75) ratingBias = 'mixed'; // 35% are mixed
        else ratingBias = 'bad';                               // 25% are disliked

        // Number of reviews per movie (varied engagement)
        const numReviews = randomInt(8, 35);

        // Shuffle users and pick subset
        const shuffledUserIds = [...userIds].sort(() => Math.random() - 0.5);
        const reviewerIds = shuffledUserIds.slice(0, Math.min(numReviews, userIds.length));

        for (const userId of reviewerIds) {
            // Generate rating based on bias
            let rating: number;
            const roll = Math.random();
            switch (ratingBias) {
                case 'good':
                    // Skewed toward 4-5
                    if (roll < 0.55) rating = 5;
                    else if (roll < 0.85) rating = 4;
                    else if (roll < 0.95) rating = 3;
                    else rating = randomInt(1, 2);
                    break;
                case 'bad':
                    // Skewed toward 1-2
                    if (roll < 0.40) rating = 1;
                    else if (roll < 0.75) rating = 2;
                    else if (roll < 0.90) rating = 3;
                    else rating = randomInt(4, 5);
                    break;
                case 'mixed':
                default:
                    // Bell curve around 3
                    if (roll < 0.15) rating = 1;
                    else if (roll < 0.30) rating = 2;
                    else if (roll < 0.60) rating = 3;
                    else if (roll < 0.80) rating = 4;
                    else rating = 5;
                    break;
            }

            // Decide if this rating has a comment (~70% have comments)
            let comment: string | null = null;
            const hasComment = Math.random() < 0.7;

            if (hasComment) {
                const useVietnamese = Math.random() < 0.45; // 45% Vietnamese

                if (rating >= 4) {
                    comment = useVietnamese
                        ? randomPick(POSITIVE_COMMENTS_VI)
                        : randomPick(POSITIVE_COMMENTS_EN);
                } else if (rating <= 2) {
                    comment = useVietnamese
                        ? randomPick(NEGATIVE_COMMENTS_VI)
                        : randomPick(NEGATIVE_COMMENTS_EN);
                } else {
                    comment = useVietnamese
                        ? randomPick(NEUTRAL_COMMENTS_VI)
                        : randomPick(NEUTRAL_COMMENTS_EN);
                }
                totalWithComments++;
            }

            const createdAt = randomDate(180);

            try {
                await prisma.rating.create({
                    data: {
                        userId,
                        movieId: movie.id,
                        rating,
                        comment,
                        createdAt,
                        updatedAt: createdAt,
                    },
                });
                totalRatings++;
            } catch (e: any) {
                // Skip duplicate (unique constraint on profileId+movieId)
                if (!e.message?.includes('Unique constraint')) {
                    console.warn(`  ⚠️ Skipped rating for movie "${movie.title}": ${e.message}`);
                }
            }
        }

        const avgForMovie = Math.round(
            reviewerIds.length > 0
                ? (await prisma.rating.aggregate({
                    where: { movieId: movie.id },
                    _avg: { rating: true },
                }))._avg.rating || 0
                : 0
        );
        const biasLabel = ratingBias === 'good' ? '👍' : ratingBias === 'bad' ? '👎' : '🤝';
        console.log(`  ${biasLabel} "${movie.title}" — ${reviewerIds.length} reviews, avg ${avgForMovie}⭐`);
    }

    console.log(`\n🎉 Seeding complete!`);
    console.log(`   📊 Total ratings: ${totalRatings}`);
    console.log(`   💬 With comments: ${totalWithComments}`);
    console.log(`   ⭐ Star-only: ${totalRatings - totalWithComments}`);
    console.log(`   👥 Users: ${userIds.length}`);
    console.log(`   🎬 Movies reviewed: ${movies.length}`);
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
