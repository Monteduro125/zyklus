package de.zyklus.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.Typeface;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.Locale;

/** Speichert die von der Web-App berechneten Tage und zeichnet die Widgets. */
final class WidgetData {
    private static final String PREFS = "widget";
    private static final String KEY = "data";

    private WidgetData() {}

    static void save(Context ctx, String json) {
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY, json).apply();
    }

    /** Alle Tage ab heute, oder ein leeres Array, wenn nichts (mehr) da ist. */
    static JSONArray daysFromToday(Context ctx) {
        JSONArray out = new JSONArray();
        try {
            SharedPreferences p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            String raw = p.getString(KEY, null);
            if (raw == null) return out;
            JSONArray days = new JSONObject(raw).getJSONArray("days");
            String today = LocalDate.now().toString();
            for (int i = 0; i < days.length(); i++) {
                JSONObject d = days.getJSONObject(i);
                if (d.getString("d").compareTo(today) >= 0) out.put(d);
            }
        } catch (Exception ignored) {
            // Kaputte Daten: Widget zeigt „App öffnen“.
        }
        return out;
    }

    static void updateAll(Context ctx) {
        AppWidgetManager m = AppWidgetManager.getInstance(ctx);
        Class<?>[] providers = {SmallWidget.class, MediumWidget.class, WeekWidget.class};
        for (Class<?> c : providers) {
            int[] ids = m.getAppWidgetIds(new ComponentName(ctx, c));
            for (int id : ids) m.updateAppWidget(id, build(ctx, c));
        }
    }

    static RemoteViews build(Context ctx, Class<?> provider) {
        int layout = provider == SmallWidget.class ? R.layout.widget_small
                : provider == MediumWidget.class ? R.layout.widget_medium
                : R.layout.widget_week;
        RemoteViews v = new RemoteViews(ctx.getPackageName(), layout);

        Intent open = new Intent(ctx, MainActivity.class);
        PendingIntent pi = PendingIntent.getActivity(ctx, 0, open,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        v.setOnClickPendingIntent(R.id.root, pi);

        JSONArray days = daysFromToday(ctx);
        float density = ctx.getResources().getDisplayMetrics().density;
        try {
            if (days.length() == 0) {
                fillEmpty(ctx, v, provider);
                return v;
            }
            JSONObject t = days.getJSONObject(0);
            int color = Color.parseColor(t.getString("color"));

            if (provider == WeekWidget.class) {
                v.setImageViewBitmap(R.id.strip, weekStrip(days, density));
                v.setTextViewText(R.id.date, t.optString("date"));
                return v;
            }

            int ringPx = (int) ((provider == SmallWidget.class ? 40 : 84) * density);
            v.setImageViewBitmap(R.id.ring, ring(ringPx, t.getInt("day"), t.getInt("len"), color,
                    provider == MediumWidget.class));
            v.setTextViewText(R.id.label, t.getString("label"));
            v.setTextColor(R.id.label, color);

            if (provider == SmallWidget.class) {
                v.setTextViewText(R.id.next, t.optString("date").isEmpty() ? t.getString("next") : t.getString("date"));
            } else {
                v.setTextViewText(R.id.energy, "Energie " + dots(t.getInt("energy")));
                v.setTextViewText(R.id.idea, t.getString("idea"));
                v.setTextViewText(R.id.next, t.getString("next"));
            }
        } catch (Exception e) {
            fillEmpty(ctx, v, provider);
        }
        return v;
    }

    private static void fillEmpty(Context ctx, RemoteViews v, Class<?> provider) {
        String msg = ctx.getString(R.string.widget_empty);
        if (provider == WeekWidget.class) {
            v.setTextViewText(R.id.date, msg);
        } else {
            v.setTextViewText(R.id.label, msg);
        }
    }

    private static String dots(int n) {
        StringBuilder b = new StringBuilder();
        for (int i = 0; i < 5; i++) b.append(i < n ? '●' : '○');
        return b.toString();
    }

    /** Fortschrittsring mit Tageszahl in der Mitte. */
    static Bitmap ring(int size, int day, int len, int color, boolean showNumber) {
        Bitmap bmp = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(bmp);
        float stroke = size * 0.12f;
        RectF r = new RectF(stroke / 2, stroke / 2, size - stroke / 2, size - stroke / 2);

        Paint track = new Paint(Paint.ANTI_ALIAS_FLAG);
        track.setStyle(Paint.Style.STROKE);
        track.setStrokeWidth(stroke);
        track.setColor(0x33FFFFFF);
        c.drawArc(r, 0, 360, false, track);

        Paint arc = new Paint(track);
        arc.setColor(color);
        arc.setStrokeCap(Paint.Cap.ROUND);
        float sweep = 360f * Math.min(1f, Math.max(0.03f, day / (float) Math.max(1, len)));
        c.drawArc(r, -90, sweep, false, arc);

        if (showNumber) {
            Paint txt = new Paint(Paint.ANTI_ALIAS_FLAG);
            txt.setColor(0xFFF1EFF5);
            txt.setTextAlign(Paint.Align.CENTER);
            txt.setTypeface(Typeface.DEFAULT_BOLD);
            txt.setTextSize(size * 0.32f);
            float y = size / 2f - (txt.descent() + txt.ascent()) / 2f;
            c.drawText(String.valueOf(day), size / 2f, y, txt);
        } else {
            Paint dot = new Paint(Paint.ANTI_ALIAS_FLAG);
            dot.setColor(color);
            c.drawCircle(size / 2f, size / 2f, size * 0.16f, dot);
        }
        return bmp;
    }

    /** Sieben Kreise in Phasenfarben mit Wochentag und Datum. */
    static Bitmap weekStrip(JSONArray days, float density) throws Exception {
        int n = Math.min(7, days.length());
        int cell = (int) (36 * density);
        int gap = (int) (6 * density);
        int w = n * cell + (n - 1) * gap;
        int h = cell;
        Bitmap bmp = Bitmap.createBitmap(Math.max(1, w), h, Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(bmp);

        Paint fill = new Paint(Paint.ANTI_ALIAS_FLAG);
        Paint ring = new Paint(Paint.ANTI_ALIAS_FLAG);
        ring.setStyle(Paint.Style.STROKE);
        ring.setStrokeWidth(2 * density);
        ring.setColor(0xFFFFFFFF);
        Paint wd = new Paint(Paint.ANTI_ALIAS_FLAG);
        wd.setColor(0xFFFFFFFF);
        wd.setTextAlign(Paint.Align.CENTER);
        wd.setTextSize(10 * density);
        Paint num = new Paint(wd);
        num.setTypeface(Typeface.DEFAULT_BOLD);
        num.setTextSize(13 * density);

        for (int i = 0; i < n; i++) {
            JSONObject d = days.getJSONObject(i);
            LocalDate date = LocalDate.parse(d.getString("d"));
            float cx = i * (cell + gap) + cell / 2f;
            float cy = h / 2f;
            fill.setColor(Color.parseColor(d.getString("color")));
            c.drawCircle(cx, cy, cell / 2f - density, fill);
            if (i == 0) c.drawCircle(cx, cy, cell / 2f - density * 1.5f, ring);
            String day = date.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.GERMAN).substring(0, 2);
            c.drawText(day, cx, cy - 2 * density, wd);
            c.drawText(String.valueOf(date.getDayOfMonth()), cx, cy + 11 * density, num);
        }
        return bmp;
    }
}
