"""
ReviewIQ — Synthetic Demo Data Generator
Generates reviewiq_demo_data.csv with 220 reviews across 3 products.
Designed to trigger the CRITICAL packaging alert on NovaBuds X1.
"""

import csv
import random
from datetime import datetime, timedelta

def generate_demo_data():
    """Generate 220 realistic reviews and save to CSV."""
    reviews = []
    now = datetime.utcnow()

    # ─────────────────────────────────────────────────────────────────────
    # PRODUCT 1: NovaBuds X1 — Earbuds — 90 reviews
    # Reviews 1-50: Normal period (30-15 days ago). Packaging complaints ~8%
    # Reviews 51-90: CRISIS period (last 14 days). Packaging complaints ~42%
    # Reviews 83-90: BOT CLUSTER (near-duplicate battery praise)
    # ─────────────────────────────────────────────────────────────────────

    # Normal period reviews (1-50)
    normal_positive = [
        "These earbuds have incredible sound quality. Bass is deep and rich.",
        "Battery lasts a solid 8 hours, even at high volume. Very impressed.",
        "The fit is so comfortable I forget I'm wearing them during workouts.",
        "Noise cancellation is top-notch. Can't hear anything on the subway.",
        "Crystal clear audio for calls. Everyone says I sound great.",
        "Love the quick charge feature. 10 minutes gives me 2 hours.",
        "The Bluetooth connection is rock solid, never drops.",
        "Build quality feels premium. The case has a nice weight to it.",
        "Best earbuds I've owned. Sound rivals my over-ear headphones.",
        "Touch controls are responsive and intuitive. Easy to skip tracks.",
        "Delivery was fast, arrived 2 days early. Well packaged too.",
        "Amazing value for the price. Sounds better than brands costing 3x more.",
        "The transparency mode is incredibly natural sounding.",
        "Perfect for gym sessions. Sweat-proof and stays in place.",
        "Pairing with my phone was instant. Love the seamless experience.",
        "Great bass response without muddying the mids. Well tuned.",
        "Comfortable even after 4 hour listening sessions. No ear fatigue.",
        "The app EQ customization is a nice bonus. Tailored to my preferences.",
        "Mic quality is surprisingly good for such small buds.",
        "Love the sleek design. Gets compliments whenever people notice them.",
        "Solid battery life. Gets me through a full work day easily.",
        "Packaging was neat and premium looking. Good first impression.",
        "Audio latency is minimal. Great for watching videos.",
        "The ambient sound mode is useful when walking in traffic.",
        "Very lightweight. Barely feel them in my ears.",
        "Fast delivery and product arrived in perfect condition.",
        "Customer support was helpful when I had a pairing question.",
        "Sound stage is surprisingly wide for in-ear models.",
        "The charging case is compact and fits nicely in my pocket.",
        "Really solid product overall. Highly recommend.",
    ]

    normal_negative_packaging = [
        "Sound is great but the box arrived slightly dented.",
        "Packaging could be better. The case was loose inside the box.",
        "The earbuds are good but the unboxing experience was disappointing.",
        "Box was damaged during shipping. Product was fine though.",
    ]

    normal_negative_other = [
        "Battery drains faster than advertised. Only getting 5 hours.",
        "The fit isn't great for small ears. Keeps falling out.",
        "Price feels a bit high compared to similar products.",
        "Customer support took 3 days to respond to my inquiry.",
        "Build quality is okay but the plastic feels cheap near the hinges.",
        "Delivery took longer than expected. Not happy with the wait.",
    ]

    # Build normal period (50 reviews)
    all_normal = []
    all_normal.extend([(r, "positive") for r in normal_positive])
    all_normal.extend([(r, "negative") for r in normal_negative_packaging])
    all_normal.extend([(r, "negative") for r in normal_negative_other])

    random.shuffle(all_normal)
    for i, (text, _) in enumerate(all_normal[:50]):
        days_ago = random.randint(15, 30)
        hours = random.randint(0, 23)
        reviews.append({
            "product_name": "NovaBuds X1",
            "category": "Earbuds",
            "review_text": text,
            "submitted_at": (now - timedelta(days=days_ago, hours=hours)).strftime("%Y-%m-%d %H:%M:%S"),
        })

    # Crisis period reviews (51-82) — 42% packaging complaints
    crisis_packaging = [
        "Box arrived completely smashed. The earbuds case was scratched.",
        "Terrible packaging. No padding inside. Product was rattling around.",
        "The box was crushed and taped back together. Clearly mishandled.",
        "Received in a torn package. One earbud wasn't even in the case.",
        "Packaging is worse than last time. Box was soaked and falling apart.",
        "डिब्बा टूटा हुआ आया। बहुत निराशा हुई।",
        "ಪ್ಯಾಕೇಜಿಂಗ್ ಕೆಟ್ಟದಾಗಿತ್ತು. ಬಾಕ್ಸ್ ಹಾನಿಗೊಳಗಾಗಿತ್ತು.",
        "Package was open when delivered. Seal was broken. Very concerning.",
        "The packaging quality has gone down drastically. Feels cheap now.",
        "My box had water damage. The instruction manual was unreadable.",
        "Flimsy packaging. The product almost fell out when I opened it.",
        "Received damaged box for the second time. Quality control issue?",
        "पैकेजिंग बेहद खराब थी। प्रोडक्ट को कोई सुरक्षा नहीं।",
        "Box was bent in half. Lucky the earbuds survived.",
        "Outer packaging was fine but inner box was crushed. Need better design.",
        "The unboxing experience used to be premium. Now its just cardboard mess.",
    ]

    crisis_normal = [
        "Still love the sound quality. Best earbuds at this price point.",
        "Battery life is excellent as always. Gets me through the day.",
        "Great product but I wish they came in more colors.",
        "Sound is amazing. Clear highs and punchy bass.",
        "Noise cancellation works perfectly on my commute.",
        "Comfortable fit for long sessions. No complaints.",
        "The build quality of the earbuds themselves is great.",
        "Fast delivery this time. Arrived next day.",
        "ANC is improved from the previous version. Very happy.",
        "बैटरी लाइफ बहुत अच्छी है। पूरे दिन चलती है।",
        "ಧ್ವನಿ ಗುಣಮಟ್ಟ ಅತ್ಯುತ್ತಮ. ತುಂಬಾ ಖುಷಿಯಾಗಿದ್ದೇನೆ.",
        "Decent earbuds for the money. Nothing extraordinary though.",
        "Good bass but mids could be a little clearer.",
        "Pairing is seamless. Works instantly with my laptop too.",
        "The case magnets are strong. Earbuds snap in perfectly.",
        "My third pair from this brand. Consistently good quality buds.",
    ]

    random.shuffle(crisis_packaging)
    random.shuffle(crisis_normal)

    crisis_reviews_text = crisis_packaging[:14] + crisis_normal[:18]
    random.shuffle(crisis_reviews_text)

    for i, text in enumerate(crisis_reviews_text):
        days_ago = random.randint(1, 14)
        hours = random.randint(0, 23)
        reviews.append({
            "product_name": "NovaBuds X1",
            "category": "Earbuds",
            "review_text": text,
            "submitted_at": (now - timedelta(days=days_ago, hours=hours)).strftime("%Y-%m-%d %H:%M:%S"),
        })

    # Bot cluster (83-90) — near-duplicate battery praise
    bot_templates = [
        "Amazing battery life. Best earbuds ever. Highly recommend.",
        "Amazing battery life! Best earbuds ever! Highly recommend!",
        "amazing battery life best earbuds ever highly recommend",
        "Amazing battery life, best earbuds ever, highly recommend.",
        "AMAZING battery life. BEST earbuds ever. HIGHLY recommend.",
        "Amazing battery life - best earbuds ever - highly recommend",
        "Amazing battery life.. Best earbuds ever.. Highly recommend..",
        "Amazing battery life. Best earbuds ever. Highly Recommend!",
    ]

    for text in bot_templates:
        days_ago = random.randint(1, 3)
        reviews.append({
            "product_name": "NovaBuds X1",
            "category": "Earbuds",
            "review_text": text,
            "submitted_at": (now - timedelta(days=days_ago, hours=random.randint(0, 23))).strftime("%Y-%m-%d %H:%M:%S"),
        })

    # ─────────────────────────────────────────────────────────────────────
    # PRODUCT 2: PixelMax Pro — Smartphone — 80 reviews
    # Control category. Mix English+Hinglish. No major trend.
    # Includes sarcastic + ambiguous reviews.
    # ─────────────────────────────────────────────────────────────────────

    pixel_positive = [
        "This phone is blazing fast. Apps open instantly.",
        "Camera quality is insane. Night mode is a game changer.",
        "Display is gorgeous. Colors pop and viewing angles are perfect.",
        "Battery easily lasts 2 days with moderate use. Impressive.",
        "Build quality feels flagship. Metal frame with glass back.",
        "5G speeds are incredible. Downloads happen in seconds.",
        "The fingerprint sensor is the fastest I've used.",
        "Smooth 120Hz display makes everything feel buttery.",
        "Great value smartphone. Has features of phones twice the price.",
        "Camera AI is smart. Auto detects scenes and adjusts perfectly.",
        "Phone heat management is great. No throttling during games.",
        "Delivery was prompt and phone arrived in perfect condition.",
        "Speakers are surprisingly loud and clear for a phone.",
        "Software is clean with no bloatware. Love the stock experience.",
        "Best phone I've bought this year without a doubt.",
        "Price to performance ratio is unbeatable in this segment.",
        "The AMOLED display with HDR support is stunning.",
        "Fast charging is great. 0 to 80% in under 30 minutes.",
        "Lightweight design doesn't compromise on battery size.",
        "Customer support was amazing. Resolved my issue in one call.",
        "Bahut accha phone hai. Camera ekdum top class.",
        "Display bohot sharp hai. Movies dekhne mein maza aata hai.",
        "Yeh phone apne price range mein sabse best hai bhai.",
        "Battery backup kamaal ka hai. 2 din easy chalti hai.",
        "Phone ka look premium hai. Logo puuchte hain kaunsa phone hai.",
    ]

    pixel_negative = [
        "Camera is overprocessed. Photos look artificial in daylight.",
        "Battery drains fast with 5G on. Expected better.",
        "Build is okay but back glass scratches very easily.",
        "Price was hiked right after I ordered. Feels scammy.",
        "Delivery was delayed by a week. No updates from support.",
        "Customer support made me wait 45 minutes on hold. Terrible.",
        "Phone heats up quite a bit during video calls.",
        "The selfie camera is mediocre at best. Grainy in low light.",
        "Packaging could be more eco-friendly. Too much plastic.",
        "Price mein thoda zyada hai but chalega.",
        "Support team ne bohot late reply kiya. Not acceptable.",
    ]

    pixel_sarcastic = [
        "Oh wow, another software update that breaks something. Fantastic.",
        "Love how the battery dies right when I need it most. Perfect timing.",
        "Great job making the phone so slippery it needs a case immediately.",
        "Sure, the camera is 'AI powered' — if AI means adding extra blur.",
        "What an incredible achievement — a phone that freezes in 2026.",
    ]

    pixel_ambiguous = [
        "The phone is alright I guess. Does what it needs to do.",
        "Not sure how I feel about this one. Good in some ways bad in others.",
        "It's a phone. Works fine. Nothing special but nothing terrible.",
        "Could be better could be worse. Average experience overall.",
        "Mixed feelings. Camera is great but battery life is just okay.",
    ]

    all_pixel = []
    all_pixel.extend(pixel_positive)
    all_pixel.extend(pixel_negative)
    all_pixel.extend(pixel_sarcastic)
    all_pixel.extend(pixel_ambiguous)

    # Pad to 80 with variations
    extra_pixel = [
        "PixelMax Pro has the best display I've seen at this price.",
        "Would recommend to anyone looking for a good mid-range phone.",
        "Software updates are regular. Phone feels fresh even after 6 months.",
        "Gaming performance is decent. Handles most titles fine.",
        "Love the dual speaker setup. Media consumption is enjoyable.",
        "Solid phone overall. Minor software bugs but nothing major.",
        "Screen protector came pre-applied. Nice touch.",
        "Photo quality in daylight is incredible. Social media ready.",
        "Phone feels premium. The matte finish is fingerprint resistant.",
        "Accha phone hai but thoda heavy lagta hai.",
        "Camera mein zoom quality thodi weak hai.",
        "Night mode photographs are genuinely impressive.",
        "Charging speed is adequate but not the fastest in its class.",
        "The notification LED being removed is a disappointment.",
        "Face unlock works fast even in dim lighting.",
        "Data transfer from old phone was seamless. Good migration tool.",
        "In-box accessories are minimal. No charger included.",
        "PixelMax Pro handles multitasking without breaking a sweat.",
        "Display brightness is enough for outdoor visibility.",
        "The vibration motor feels refined and precise.",
        "Would buy again. Good balance of features and price.",
        "The haptic feedback is excellent. Very satisfying typing experience.",
        "Wallpapers and themes are customizable which is a nice bonus.",
        "Call quality is clear on both ends. Good signal reception.",
        "Weight distribution is comfortable for one-hand usage.",
        "Phone mein IR blaster hota toh aur accha hota.",
        "The under-display fingerprint scanner is accurate.",
        "Stereo speaker quality rivals some dedicated Bluetooth speakers.",
        "Water resistance rating gives peace of mind.",
        "Good phone for parents. Simple and reliable.",
        "Refresh rate makes scrolling social media feeds addictive.",
        "Phone doesn't lag even after installing 50+ apps.",
        "Camera app interface is intuitive and easy to navigate.",
        "Dark mode AMOLED combination saves serious battery.",
    ]

    all_pixel.extend(extra_pixel)
    random.shuffle(all_pixel)

    for text in all_pixel[:80]:
        days_ago = random.randint(1, 30)
        hours = random.randint(0, 23)
        reviews.append({
            "product_name": "PixelMax Pro",
            "category": "Smartphone",
            "review_text": text,
            "submitted_at": (now - timedelta(days=days_ago, hours=hours)).strftime("%Y-%m-%d %H:%M:%S"),
        })

    # ─────────────────────────────────────────────────────────────────────
    # PRODUCT 3: GlowSkin Serum — Skincare — 50 reviews
    # Heavy Kannada+Hindi. Customer support complaints last 20 reviews.
    # Short bot-like reviews: "good", "nice", "ok"
    # ─────────────────────────────────────────────────────────────────────

    glow_positive = [
        "My skin has never looked better. This serum is a miracle.",
        "Visible results in just 2 weeks. Dark spots are fading.",
        "Lightweight formula that absorbs quickly. No sticky feeling.",
        "Love how my skin glows after using this. Gets compliments daily.",
        "ত্বক উজ্জ্বল হয়ে গেছে। খুব ভালো প্রোডাক্ট।",
        "ಚರ್ಮ ತುಂಬಾ ಮೃದುವಾಗಿದೆ. ಈ ಸೀರಮ್ ಅದ್ಭುತ.",
        "त्वचा में बहुत फर्क आया है। दाग कम हो रहे हैं।",
        "Best serum I have tried. Better than expensive imported ones.",
        "Texture is smooth and it layers well under makeup.",
        "ಈ ಸೀರಮ್ ನನ್ನ ಚರ್ಮಕ್ಕೆ ತುಂಬಾ ಒಳ್ಳೆಯದು.",
        "Natural ingredients give me confidence in what I'm putting on my skin.",
        "यह सीरम सच में काम करता है। मुझे बहुत पसंद है।",
        "Fragrance is subtle and pleasant. Not overpowering at all.",
        "Pump dispenser is convenient. Gives just the right amount.",
        "ಬೆಲೆಗೆ ತಕ್ಕ ಗುಣಮಟ್ಟ. ಮತ್ತೆ ಖರೀದಿಸುತ್ತೇನೆ.",
    ]

    glow_support_complaints = [
        "Customer support is non-existent. No reply to my allergy complaint.",
        "Tried contacting support for return. No one picks up the phone.",
        "Support team gave wrong information about ingredients. Unacceptable.",
        "Had a skin reaction. Support took 5 days to respond.",
        "ग्राहक सेवा बहुत खराब है। कोई जवाब नहीं मिलता।",
        "ಗ್ರಾಹಕ ಬೆಂಬಲ ತುಂಬಾ ಕೆಟ್ಟದು. ಯಾರೂ ಉತ್ತರಿಸುವುದಿಲ್ಲ.",
        "Return policy is a joke. Support keeps transferring my call.",
        "Emailed support twice about damaged bottle. Still waiting.",
        "Support chat bot is useless. Keeps giving generic answers.",
        "No way to reach a human at their support center. Frustrating.",
        "ಸಪೋರ್ಟ್ ಟೀಮ್ ಸಹಾಯ ಮಾಡಲಿಲ್ಲ. ನಿರಾಶೆಯಾಯಿತು.",
        "Called support 4 times. Each time told someone will call back. Never did.",
        "Their customer service has declined massively this month.",
        "Support agent was rude when I asked about refund policy.",
        "Had allergic reaction, support told me to just stop using it. Helpful.",
    ]

    glow_short_bot = [
        "good",
        "nice",
        "ok",
        "good product",
        "nice product",
        "ok ok",
        "best",
        "good good good",
    ]

    glow_other = [
        "Serum is decent but price is a bit steep for the quantity.",
        "Took a month to see any results. Patience needed.",
        "Packaging is beautiful. Gift worthy presentation.",
        "Not suitable for oily skin types. Made me break out.",
        "Product quality is great but delivery was rough.",
        "बोतल बहुत छोटी है कीमत के हिसाब से।",
        "ಉತ್ಪನ್ನ ಚೆನ್ನಾಗಿದೆ ಆದರೆ ಬೆಲೆ ಹೆಚ್ಚು.",
    ]

    all_glow = []
    all_glow.extend(glow_positive[:10])
    all_glow.extend(glow_other)
    all_glow.extend(glow_short_bot)
    # Add support complaints as the last ~20
    all_glow.extend(glow_support_complaints)

    # Keep relative order — support complaints should be recent
    for i, text in enumerate(all_glow[:50]):
        if i < 25:
            days_ago = random.randint(10, 30)
        else:
            days_ago = random.randint(1, 10)
        hours = random.randint(0, 23)
        reviews.append({
            "product_name": "GlowSkin Serum",
            "category": "Skincare",
            "review_text": text,
            "submitted_at": (now - timedelta(days=days_ago, hours=hours)).strftime("%Y-%m-%d %H:%M:%S"),
        })

    # Sort all reviews by submitted_at
    reviews.sort(key=lambda r: r["submitted_at"])

    # Write CSV
    output_file = "reviewiq_demo_data.csv"
    with open(output_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["product_name", "category", "review_text", "submitted_at"])
        writer.writeheader()
        writer.writerows(reviews)

    print(f"✅ Generated {len(reviews)} reviews → {output_file}")
    print(f"   NovaBuds X1:   {sum(1 for r in reviews if r['product_name'] == 'NovaBuds X1')} reviews (incl. packaging crisis + bot cluster)")
    print(f"   PixelMax Pro:   {sum(1 for r in reviews if r['product_name'] == 'PixelMax Pro')} reviews (control group)")
    print(f"   GlowSkin Serum: {sum(1 for r in reviews if r['product_name'] == 'GlowSkin Serum')} reviews (support complaints)")

    return output_file


if __name__ == "__main__":
    generate_demo_data()
