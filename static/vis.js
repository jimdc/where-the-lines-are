/**
 * vis.js — Pure-canvas Tufte-inspired visualizations for where-the-lines-are
 *
 * Ten visualizations, zero external dependencies:
 *   1. drawCategoryStrip             — Small multiples for category counts (clickable)
 *   2. drawCooccurrenceMatrix        — Grayscale co-occurrence heatmap (clickable)
 *   3. renderWordFrequencyStrip      — Ranked dot plot of word frequencies
 *   4. drawCombinationDotPlot        — Horizontal dot plot of category combos
 *   5. renderWordCategoryBreakdown   — Category breakdown for a clicked word (proportion bars)
 *   6. drawExclusivityChart          — Exclusive vs shared stacked bars per category
 *   7. drawBinaryBitmap              — Dense binary data matrix (prompt × category)
 *   8. renderTaxonomyAlignment       — Rosetta Stone: concept × dataset alignment table (DOM)
 *   9. drawTaxonomyTimeline          — Drift: taxonomy expansion timeline (canvas)
 *  10. drawExclusivityTrend          — Drift: exclusivity trend across datasets (canvas)
 *
 * All functions adapt to variable numbers of categories (6–23).
 */

/* ── 1. Category Strip (Small Multiples) ── */

function drawCategoryStrip(container, counts, labels, total, namesFn, onClickCategory) {
    container.innerHTML = '';
    var max = Math.max.apply(null, labels.map(function(k) { return counts[k] || 0; }).concat([1]));
    var vals = labels.map(function(k) { return counts[k] || 0; }).sort(function(a,b) { return a-b; });
    var median = vals[Math.floor(vals.length / 2)];

    labels.forEach(function(key) {
        var count = counts[key] || 0;
        var panel = document.createElement('div');
        panel.className = 'strip-panel';
        panel.style.cursor = 'pointer';

        var canvas = document.createElement('canvas');
        var w = 140, h = 44;
        var dpr = window.devicePixelRatio || 1;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';

        var ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        var displayName = namesFn ? namesFn(key) : key;
        var barY = 24;
        var barH = 4;
        var barMaxW = 85;
        var barW = max > 0 ? (count / max) * barMaxW : 0;

        // Median reference line
        var medianX = (median / max) * barMaxW;
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(medianX, barY - 2);
        ctx.lineTo(medianX, barY + barH + 2);
        ctx.stroke();

        // Data bar
        ctx.fillStyle = '#333';
        ctx.fillRect(0, barY, barW, barH);

        // Category label (full name)
        ctx.fillStyle = '#555';
        ctx.font = '11px system-ui, -apple-system, sans-serif';
        ctx.textBaseline = 'bottom';
        ctx.textAlign = 'left';
        var truncName = displayName.length > 16 ? displayName.slice(0, 15) + '\u2026' : displayName;
        ctx.fillText(truncName, 0, barY - 4);

        // Count number (use toLocaleString for large datasets)
        ctx.fillStyle = '#111';
        ctx.font = '11px system-ui, -apple-system, sans-serif';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        ctx.fillText(count > 999 ? (count / 1000).toFixed(1) + 'k' : String(count), barW + 4, barY + barH / 2);

        panel.appendChild(canvas);
        container.appendChild(panel);

        // Click to filter by this category
        if (onClickCategory) {
            panel.addEventListener('click', function() { onClickCategory(key); });
        }
    });
}

/* ── 2. Co-occurrence Matrix ── */

function drawCooccurrenceMatrix(canvas, pairCounts, keys, onCellClick, namesFn) {
    var n = keys.length;

    // Adaptive sizing based on category count
    var cellSize = n <= 10 ? 42 : n <= 16 ? 30 : 22;
    var fontSize = n <= 10 ? 10 : n <= 16 ? 9 : 8;
    var leftLabelMargin = n <= 10 ? 100 : n <= 16 ? 110 : 120;
    var topLabelMargin = n <= 10 ? 100 : n <= 16 ? 110 : 120;
    var gap = n <= 16 ? 2 : 1;

    var gridWidth = n * (cellSize + gap);
    var totalWidth = leftLabelMargin + gridWidth;
    var totalHeight = topLabelMargin + gridWidth;

    var dpr = window.devicePixelRatio || 1;
    canvas.width = totalWidth * dpr;
    canvas.height = totalHeight * dpr;
    canvas.style.width = totalWidth + 'px';
    canvas.style.height = totalHeight + 'px';

    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, totalWidth, totalHeight);

    // Find max for normalization
    var max = 0;
    for (var i = 0; i < n; i++) {
        for (var j = i + 1; j < n; j++) {
            var pair = keys[i] + '+' + keys[j];
            var v = pairCounts[pair] || 0;
            if (v > max) max = v;
        }
    }
    if (max === 0) max = 1;

    // Column labels (top, rotated -45°)
    ctx.fillStyle = '#555';
    ctx.font = fontSize + 'px system-ui, -apple-system, sans-serif';
    for (var j = 0; j < n; j++) {
        var x = leftLabelMargin + j * (cellSize + gap) + cellSize / 2;
        var name = namesFn ? namesFn(keys[j]) : keys[j];
        ctx.save();
        ctx.translate(x, topLabelMargin - 6);
        ctx.rotate(-Math.PI / 4);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        var maxNameLen = n <= 10 ? 14 : n <= 16 ? 12 : 10;
        ctx.fillText(name.length > maxNameLen ? name.slice(0, maxNameLen - 1) + '\u2026' : name, 0, 0);
        ctx.restore();
    }

    // Row labels (left)
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (var i = 0; i < n; i++) {
        var y = topLabelMargin + i * (cellSize + gap) + cellSize / 2;
        var name = namesFn ? namesFn(keys[i]) : keys[i];
        var maxNameLen = n <= 10 ? 14 : n <= 16 ? 12 : 10;
        ctx.fillText(name.length > maxNameLen ? name.slice(0, maxNameLen - 1) + '\u2026' : name, leftLabelMargin - 6, y);
    }

    // Cells
    var cellFontSize = n <= 10 ? 10 : n <= 16 ? 8 : 7;
    ctx.font = cellFontSize + 'px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (var i = 0; i < n; i++) {
        for (var j = 0; j < n; j++) {
            var x = leftLabelMargin + j * (cellSize + gap);
            var y = topLabelMargin + i * (cellSize + gap);

            if (i === j) continue; // Diagonal: leave blank

            var pair = i < j ? keys[i] + '+' + keys[j] : keys[j] + '+' + keys[i];
            var v = pairCounts[pair] || 0;
            var intensity = v / max;

            // Gray-scale fill
            var gray = Math.round(240 - intensity * 200);
            ctx.fillStyle = 'rgb(' + gray + ', ' + gray + ', ' + gray + ')';
            ctx.fillRect(x, y, cellSize, cellSize);

            // Count number in cell (skip for tiny cells with large numbers)
            if (v > 0 && cellSize >= 20) {
                ctx.fillStyle = intensity > 0.5 ? '#fff' : '#333';
                var displayV = v > 9999 ? (v / 1000).toFixed(0) + 'k' : String(v);
                ctx.fillText(displayV, x + cellSize / 2, y + cellSize / 2);
            }
        }
    }

    // Click handler
    if (onCellClick) {
        canvas.onclick = function(e) {
            var rect = canvas.getBoundingClientRect();
            var mx = e.clientX - rect.left;
            var my = e.clientY - rect.top;
            var col = Math.floor((mx - leftLabelMargin) / (cellSize + gap));
            var row = Math.floor((my - topLabelMargin) / (cellSize + gap));
            if (col >= 0 && col < n && row >= 0 && row < n && col !== row) {
                onCellClick(keys[row], keys[col]);
            }
        };
    }
}

/* ── 3. Word Frequency Strip (Dot Plot) ── */

function renderWordFrequencyStrip(container, counts, onClickWord) {
    container.innerHTML = '';
    var entries = Object.entries(counts)
        .sort(function(a, b) { return b[1] - a[1]; })
        .slice(0, 40);

    if (entries.length === 0) {
        var msg = document.createElement('p');
        msg.className = 'muted';
        msg.textContent = 'No words to display.';
        container.appendChild(msg);
        return;
    }

    var max = entries[0][1];
    var rowHeight = 18;
    var labelWidth = 90;
    var countWidth = 50;
    var dotAreaWidth = 160;
    var totalWidth = labelWidth + dotAreaWidth + countWidth;
    var totalHeight = entries.length * rowHeight + 4;

    var canvas = document.createElement('canvas');
    var dpr = window.devicePixelRatio || 1;
    canvas.width = totalWidth * dpr;
    canvas.height = totalHeight * dpr;
    canvas.style.width = totalWidth + 'px';
    canvas.style.height = totalHeight + 'px';
    canvas.style.cursor = 'pointer';

    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    entries.forEach(function(entry, i) {
        var word = entry[0], count = entry[1];
        var y = i * rowHeight + rowHeight / 2 + 2;
        var dotX = labelWidth + (count / max) * (dotAreaWidth - 10);

        // Word label
        ctx.fillStyle = '#333';
        ctx.font = '11px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(word.length > 12 ? word.slice(0, 11) + '\u2026' : word, labelWidth - 8, y);

        // Reference line
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(labelWidth, y);
        ctx.lineTo(labelWidth + dotAreaWidth - 10, y);
        ctx.stroke();

        // Dot
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(dotX, y, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Count (use K notation for large numbers)
        ctx.fillStyle = '#666';
        ctx.textAlign = 'left';
        var displayCount = count > 9999 ? (count / 1000).toFixed(1) + 'k' : String(count);
        ctx.fillText(displayCount, labelWidth + dotAreaWidth - 4, y);
    });

    // Click handler
    canvas.addEventListener('click', function(e) {
        var rect = canvas.getBoundingClientRect();
        var my = e.clientY - rect.top;
        var idx = Math.floor((my - 2) / rowHeight);
        if (idx >= 0 && idx < entries.length && onClickWord) {
            onClickWord(entries[idx][0]);
        }
    });

    container.appendChild(canvas);
}

/* ── 4. Combination Dot Plot ── */

function drawCombinationDotPlot(canvas, comboCounts, glossFn) {
    var sorted = Object.entries(comboCounts)
        .filter(function(e) { return e[1] >= 2; })
        .sort(function(a, b) { return b[1] - a[1]; })
        .slice(0, 30);

    if (sorted.length === 0) {
        canvas.style.display = 'none';
        return;
    }
    canvas.style.display = '';

    // Measure longest label to determine labelWidth
    var tempCanvas = document.createElement('canvas');
    var tempCtx = tempCanvas.getContext('2d');
    tempCtx.font = '10px system-ui, -apple-system, sans-serif';
    var maxLabelW = 0;
    sorted.forEach(function(entry) {
        var combo = entry[0];
        var label = combo === 'none' ? 'none' :
            combo.split('+').map(function(k) { return glossFn ? glossFn(k) : k; }).join(' + ');
        var w = tempCtx.measureText(label).width;
        if (w > maxLabelW) maxLabelW = w;
    });

    var max = sorted[0][1];
    var rowHeight = 20;
    var labelWidth = Math.min(Math.max(180, maxLabelW + 16), 350);
    var dotAreaWidth = 200;
    var countWidth = 60;
    var totalWidth = labelWidth + dotAreaWidth + countWidth;
    var totalHeight = sorted.length * rowHeight + 8;

    var dpr = window.devicePixelRatio || 1;
    canvas.width = totalWidth * dpr;
    canvas.height = totalHeight * dpr;
    canvas.style.width = totalWidth + 'px';
    canvas.style.height = totalHeight + 'px';

    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, totalWidth, totalHeight);

    var maxDisplayLen = labelWidth > 280 ? 45 : labelWidth > 220 ? 35 : 28;

    sorted.forEach(function(entry, i) {
        var combo = entry[0], count = entry[1];
        var y = i * rowHeight + rowHeight / 2 + 4;
        var dotX = labelWidth + (count / max) * (dotAreaWidth - 10);

        // Combo label (full names)
        var label = combo === 'none' ? 'none' :
            combo.split('+').map(function(k) { return glossFn ? glossFn(k) : k; }).join(' + ');
        var displayLabel = label.length > maxDisplayLen ? label.slice(0, maxDisplayLen - 1) + '\u2026' : label;

        ctx.fillStyle = '#333';
        ctx.font = '10px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(displayLabel, labelWidth - 8, y);

        // Reference line
        ctx.strokeStyle = '#e8e8e8';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(labelWidth, y);
        ctx.lineTo(labelWidth + dotAreaWidth - 10, y);
        ctx.stroke();

        // Dot
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(dotX, y, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Count
        ctx.fillStyle = '#666';
        ctx.font = '10px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'left';
        var displayCount = count > 9999 ? (count / 1000).toFixed(1) + 'k' : String(count);
        ctx.fillText(displayCount, labelWidth + dotAreaWidth - 4, y);
    });
}

/* ── 5. Word → Category Breakdown ── */

function renderWordCategoryBreakdown(container, word, data, keys, namesFn) {
    container.innerHTML = '';
    if (!word) return;

    // Use the global textField if available, fallback to 'prompt'
    var textField = (typeof activeSchema !== 'undefined' && activeSchema && activeSchema.textField) ? activeSchema.textField : 'prompt';
    var wordLower = word.toLowerCase();
    var matching = data.filter(function(row) {
        var text = row[textField] || row.prompt || '';
        return text.toLowerCase().includes(wordLower);
    });

    if (matching.length === 0) {
        container.innerHTML = '<p class="muted">No prompts contain \u201c' + word + '\u201d.</p>';
        return;
    }

    // Count categories in matching prompts
    var catCounts = {};
    keys.forEach(function(k) { catCounts[k] = 0; });
    matching.forEach(function(row) {
        keys.forEach(function(k) {
            if (row[k] === 1) catCounts[k]++;
        });
    });

    // Sort by count descending, filter zeros
    var entries = keys.map(function(k) { return [k, catCounts[k]]; })
        .filter(function(e) { return e[1] > 0; })
        .sort(function(a, b) { return b[1] - a[1]; });

    if (entries.length === 0) {
        container.innerHTML = '<p class="muted">\u201c' + word + '\u201d (' + matching.length + ' prompts) \u2014 no categories flagged.</p>';
        return;
    }

    // Header
    var header = document.createElement('p');
    header.className = 'breakdown-header';
    header.innerHTML = '<strong>\u201c' + word + '\u201d</strong> appears in ' + matching.length.toLocaleString() + ' prompts. Categories flagged:';
    container.appendChild(header);

    // Draw mini bar chart — bars encode proportion (0–100%)
    var total = matching.length;
    var rowHeight = 20;
    var nameWidth = keys.length > 10 ? 130 : 120;
    var barAreaWidth = 120;
    var countWidth = 100;
    var totalWidth = nameWidth + barAreaWidth + countWidth;
    var totalHeight = entries.length * rowHeight + 4;

    var canvas = document.createElement('canvas');
    var dpr = window.devicePixelRatio || 1;
    canvas.width = totalWidth * dpr;
    canvas.height = totalHeight * dpr;
    canvas.style.width = totalWidth + 'px';
    canvas.style.height = totalHeight + 'px';

    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    entries.forEach(function(entry, i) {
        var key = entry[0], count = entry[1];
        var y = i * rowHeight + rowHeight / 2 + 2;
        var pct = total > 0 ? count / total : 0;
        var barW = pct * (barAreaWidth - 10);
        var name = namesFn ? namesFn(key) : key;

        // Category name
        ctx.fillStyle = '#333';
        ctx.font = '11px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        var maxNameLen = keys.length > 10 ? 18 : 16;
        ctx.fillText(name.length > maxNameLen ? name.slice(0, maxNameLen - 1) + '\u2026' : name, nameWidth - 8, y);

        // Bar (proportion-scaled)
        ctx.fillStyle = '#555';
        ctx.fillRect(nameWidth, y - 4, barW, 8);

        // Count with proportion
        ctx.fillStyle = '#666';
        ctx.textAlign = 'left';
        var pctStr = Math.round(pct * 100);
        var countStr = count > 999 ? (count / 1000).toFixed(1) + 'k' : String(count);
        var totalStr = total > 999 ? (total / 1000).toFixed(1) + 'k' : String(total);
        ctx.fillText(countStr + '/' + totalStr + ' (' + pctStr + '%)', nameWidth + barW + 4, y);
    });

    container.appendChild(canvas);
}

/* ── 6. Category Exclusivity Chart ── */

function drawExclusivityChart(canvas, exclusivity, singleCounts, keys, namesFn) {
    var n = keys.length;
    var rowHeight = n > 16 ? 20 : 24;
    var nameWidth = n > 10 ? 120 : 110;
    var barAreaWidth = 200;
    var labelWidth = 120;
    var totalWidth = nameWidth + barAreaWidth + labelWidth;
    var totalHeight = n * rowHeight + 4;

    // Find max total for bar scaling
    var maxTotal = 0;
    keys.forEach(function(k) {
        var t = (singleCounts[k] || 0);
        if (t > maxTotal) maxTotal = t;
    });
    if (maxTotal === 0) maxTotal = 1;

    var dpr = window.devicePixelRatio || 1;
    canvas.width = totalWidth * dpr;
    canvas.height = totalHeight * dpr;
    canvas.style.width = totalWidth + 'px';
    canvas.style.height = totalHeight + 'px';

    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, totalWidth, totalHeight);

    var fontSize = n > 16 ? 9 : 10;
    var maxNameLen = n > 10 ? 16 : 16;

    keys.forEach(function(key, i) {
        var y = i * rowHeight + rowHeight / 2 + 2;
        var excl = exclusivity.exclusive[key] || 0;
        var shared = exclusivity.shared[key] || 0;
        var total = excl + shared;
        var name = namesFn ? namesFn(key) : key;

        // Category label
        ctx.fillStyle = '#333';
        ctx.font = fontSize + 'px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(name.length > maxNameLen ? name.slice(0, maxNameLen - 1) + '\u2026' : name, nameWidth - 8, y);

        if (total === 0) return;

        var fullBarW = (total / maxTotal) * (barAreaWidth - 10);
        var exclW = (excl / total) * fullBarW;
        var sharedW = fullBarW - exclW;

        // Exclusive segment (dark)
        ctx.fillStyle = '#333';
        ctx.fillRect(nameWidth, y - 5, exclW, 10);

        // Shared segment (light)
        ctx.fillStyle = '#bbb';
        ctx.fillRect(nameWidth + exclW, y - 5, sharedW, 10);

        // Label: "N alone (P%) | M shared"
        var pct = Math.round((excl / total) * 100);
        ctx.fillStyle = '#666';
        ctx.font = fontSize + 'px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'left';
        var exclStr = excl > 999 ? (excl / 1000).toFixed(1) + 'k' : String(excl);
        var sharedStr = shared > 999 ? (shared / 1000).toFixed(1) + 'k' : String(shared);
        ctx.fillText(exclStr + ' alone (' + pct + '%)  |  ' + sharedStr + ' shared', nameWidth + fullBarW + 6, y);
    });
}

/* ── 7. Prompt Binary Bitmap (Data Matrix) ── */

function drawBinaryBitmap(container, data, keys, namesFn) {
    container.innerHTML = '';
    if (data.length === 0) {
        var msg = document.createElement('p');
        msg.className = 'muted';
        msg.textContent = 'No prompts to display.';
        container.appendChild(msg);
        return;
    }

    var n = keys.length;
    var cellW = n > 16 ? 10 : 8;
    var cellH = 3;
    var colGap = n > 16 ? 1 : 2;
    var rowGap = 1;
    var rows = data.length;

    // Adaptive header: rotate labels for many categories
    var rotateHeaders = n > 10;
    var headerH = rotateHeaders ? 60 : 24;

    var gridW = n * cellW + (n - 1) * colGap;
    var gridH = rows * (cellH + rowGap);
    var totalW = gridW;
    var totalH = headerH + gridH;

    var canvas = document.createElement('canvas');
    var dpr = window.devicePixelRatio || 1;
    canvas.width = totalW * dpr;
    canvas.height = totalH * dpr;
    canvas.style.width = totalW + 'px';
    canvas.style.height = totalH + 'px';

    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // Column headers
    ctx.fillStyle = '#555';
    var headerFontSize = n > 16 ? 7 : 8;
    ctx.font = headerFontSize + 'px system-ui, -apple-system, sans-serif';

    for (var c = 0; c < n; c++) {
        var cx = c * (cellW + colGap) + cellW / 2;
        var label = namesFn ? namesFn(keys[c]) : keys[c];

        if (rotateHeaders) {
            ctx.save();
            ctx.translate(cx, headerH - 4);
            ctx.rotate(-Math.PI / 4);
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            var maxLen = n > 16 ? 8 : 10;
            ctx.fillText(label.length > maxLen ? label.slice(0, maxLen - 1) + '\u2026' : label, 0, 0);
            ctx.restore();
        } else {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(keys[c], cx, headerH - 2);
        }
    }

    // Data cells
    for (var r = 0; r < rows; r++) {
        var y = headerH + r * (cellH + rowGap);
        var row = data[r];
        for (var c = 0; c < n; c++) {
            var x = c * (cellW + colGap);
            ctx.fillStyle = row[keys[c]] === 1 ? '#333' : '#e8e8e8';
            ctx.fillRect(x, y, cellW, cellH);
        }
    }

    container.appendChild(canvas);
}

/* ── 8. Split Verdict: Divergence Chart (Canvas) ── */

function drawDivergenceChart(canvas, divergenceData, keys, config, namesFn) {
    if (!divergenceData || !divergenceData.length) {
        canvas.style.display = 'none';
        return;
    }
    canvas.style.display = '';

    var n = divergenceData.length;
    var rowHeight = n > 16 ? 20 : 24;
    var nameWidth = n > 10 ? 130 : 120;
    var barAreaWidth = 200;
    var labelWidth = 180;
    var totalWidth = nameWidth + barAreaWidth + labelWidth;
    var totalHeight = n * rowHeight + 4;

    var dpr = window.devicePixelRatio || 1;
    canvas.width = totalWidth * dpr;
    canvas.height = totalHeight * dpr;
    canvas.style.width = totalWidth + 'px';
    canvas.style.height = totalHeight + 'px';

    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, totalWidth, totalHeight);

    var fontSize = n > 16 ? 9 : 10;

    divergenceData.forEach(function(item, i) {
        var y = i * rowHeight + rowHeight / 2 + 2;
        var name = namesFn ? namesFn(item.key) : item.key;
        var agreeRate = item.agree / (item.agree + item.disagree);
        var disagreeRate = 1 - agreeRate;
        var total = item.agree + item.disagree;

        // Category label
        ctx.fillStyle = '#333';
        ctx.font = fontSize + 'px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        var maxNameLen = n > 10 ? 18 : 16;
        ctx.fillText(name.length > maxNameLen ? name.slice(0, maxNameLen - 1) + '\u2026' : name, nameWidth - 8, y);

        if (total === 0) return;

        // Agreement bar (dark)
        var agreeW = agreeRate * (barAreaWidth - 10);
        ctx.fillStyle = '#333';
        ctx.fillRect(nameWidth, y - 5, agreeW, 10);

        // Disagreement bar (light)
        var disagreeW = disagreeRate * (barAreaWidth - 10);
        ctx.fillStyle = '#ccc';
        ctx.fillRect(nameWidth + agreeW, y - 5, disagreeW, 10);

        // Label with kappa
        ctx.fillStyle = '#666';
        ctx.font = fontSize + 'px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'left';
        var agreePct = Math.round(agreeRate * 100);
        var label = agreePct + '% agree';
        if (item.kappa !== undefined && !isNaN(item.kappa)) {
            label += ' (\u03BA=' + item.kappa.toFixed(2) + ')';
        }
        label += '  |  ' + Math.round(disagreeRate * 100) + '% diverge';
        ctx.fillText(label, nameWidth + barAreaWidth, y);
    });
}

/* ── 9. Rosetta Stone: Taxonomy Alignment Table (DOM) ── */

function renderTaxonomyAlignment(container, registry) {
    container.innerHTML = '';
    if (!registry || !registry.datasets) return;

    var datasets = registry.datasets;

    // Build concept → {datasetId → [category names]}
    var conceptMap = {};
    datasets.forEach(function(ds) {
        ds.categories.forEach(function(cat) {
            var concepts = cat.concept;
            if (!concepts) return;
            if (!Array.isArray(concepts)) concepts = [concepts];
            concepts.forEach(function(c) {
                if (!conceptMap[c]) conceptMap[c] = {};
                if (!conceptMap[c][ds.id]) conceptMap[c][ds.id] = [];
                conceptMap[c][ds.id].push(cat.short || cat.name);
            });
        });
    });

    // Sort concepts by coverage (most datasets first), then alphabetically
    var conceptList = Object.keys(conceptMap).sort(function(a, b) {
        var coverA = Object.keys(conceptMap[a]).length;
        var coverB = Object.keys(conceptMap[b]).length;
        if (coverB !== coverA) return coverB - coverA;
        return a.localeCompare(b);
    });

    // Build table
    var table = document.createElement('table');
    table.className = 'rosetta-table';

    // Header row
    var thead = document.createElement('thead');
    var headerRow = document.createElement('tr');
    var th0 = document.createElement('th');
    th0.textContent = 'Concept';
    headerRow.appendChild(th0);
    datasets.forEach(function(ds) {
        var th = document.createElement('th');
        th.textContent = ds.name.replace('Jigsaw Toxic Comments', 'Jigsaw')
            .replace('OpenAI Moderation', 'OpenAI')
            .replace('PKU-SafeRLHF', 'SafeRLHF')
            .replace('NVIDIA Aegis v2', 'Aegis');
        th.className = 'rosetta-ds-header';
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body rows
    var tbody = document.createElement('tbody');
    conceptList.forEach(function(concept) {
        var tr = document.createElement('tr');
        var tdConcept = document.createElement('td');
        tdConcept.textContent = concept;
        tdConcept.className = 'rosetta-concept';
        tr.appendChild(tdConcept);

        datasets.forEach(function(ds) {
            var td = document.createElement('td');
            var names = conceptMap[concept][ds.id];
            if (names && names.length > 0) {
                td.textContent = names.join(', ');
            } else {
                td.className = 'rosetta-empty';
                td.textContent = '\u2014';
            }
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);
}

/* ── 9. Drift: Taxonomy Timeline (Canvas) ── */

function drawTaxonomyTimeline(canvas, registry) {
    if (!registry || !registry.datasets) return;

    var datasets = registry.datasets;
    var n = datasets.length;

    // Track which concepts have appeared so far (for "new" highlighting)
    var seenConcepts = {};

    // Build per-dataset concept lists
    var dsData = datasets.map(function(ds) {
        var concepts = {};
        ds.categories.forEach(function(cat) {
            var cc = cat.concept;
            if (!cc) return;
            if (!Array.isArray(cc)) cc = [cc];
            cc.forEach(function(c) {
                if (!concepts[c]) concepts[c] = [];
                concepts[c].push(cat.short || cat.name);
            });
        });
        return {
            id: ds.id,
            name: ds.name.replace('Jigsaw Toxic Comments', 'Jigsaw')
                .replace('OpenAI Moderation', 'OpenAI')
                .replace('PKU-SafeRLHF', 'SafeRLHF')
                .replace('NVIDIA Aegis v2', 'Aegis'),
            source: ds.source,
            catCount: ds.categories.length,
            concepts: concepts
        };
    });

    // Layout
    var colWidth = 160;
    var headerHeight = 50;
    var lineHeight = 16;
    var maxConcepts = Math.max.apply(null, dsData.map(function(d) { return Object.keys(d.concepts).length; }));
    var totalWidth = n * colWidth + 20;
    var totalHeight = headerHeight + (maxConcepts + 2) * lineHeight + 10;

    var dpr = window.devicePixelRatio || 1;
    canvas.width = totalWidth * dpr;
    canvas.height = totalHeight * dpr;
    canvas.style.width = totalWidth + 'px';
    canvas.style.height = totalHeight + 'px';

    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, totalWidth, totalHeight);

    dsData.forEach(function(ds, col) {
        var x = col * colWidth + 10;

        // Dataset header
        ctx.fillStyle = '#222';
        ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(ds.name, x, 4);

        // Year and category count
        ctx.fillStyle = '#888';
        ctx.font = '10px system-ui, -apple-system, sans-serif';
        var yearMatch = ds.source.match(/\((\d{4})\)/);
        var year = yearMatch ? yearMatch[1] : '';
        ctx.fillText(year + ' \u00B7 ' + ds.catCount + ' categories', x, 20);

        // Connector line
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, 38);
        ctx.lineTo(x, totalHeight - 5);
        ctx.stroke();

        // Concept list
        var conceptKeys = Object.keys(ds.concepts).sort();
        conceptKeys.forEach(function(concept, i) {
            var y = headerHeight + i * lineHeight;
            var isNew = !seenConcepts[concept];

            ctx.fillStyle = isNew ? '#111' : '#bbb';
            ctx.font = (isNew ? 'bold ' : '') + '10px system-ui, -apple-system, sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';

            var label = concept;
            if (label.length > 18) label = label.slice(0, 17) + '\u2026';
            ctx.fillText(label, x + 6, y);
        });

        // Mark all concepts as seen
        conceptKeys.forEach(function(c) { seenConcepts[c] = true; });
    });
}

/* ── 10. Drift: Exclusivity Trend (Canvas) ── */

function drawExclusivityTrend(canvas, registry) {
    if (!registry || !registry.datasets) return;

    var datasets = registry.datasets.filter(function(ds) { return ds.stats; });
    if (datasets.length === 0) return;

    var n = datasets.length;
    var rowHeight = 28;
    var nameWidth = 120;
    var barAreaWidth = 200;
    var labelWidth = 260;
    var totalWidth = nameWidth + barAreaWidth + labelWidth;
    var totalHeight = n * rowHeight + 4;

    var dpr = window.devicePixelRatio || 1;
    canvas.width = totalWidth * dpr;
    canvas.height = totalHeight * dpr;
    canvas.style.width = totalWidth + 'px';
    canvas.style.height = totalHeight + 'px';

    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, totalWidth, totalHeight);

    datasets.forEach(function(ds, i) {
        var y = i * rowHeight + rowHeight / 2 + 2;
        var stats = ds.stats;
        var avgExcl = stats.avgExclusivity || 0;
        var multiRate = stats.multiLabelRate || 0;

        var name = ds.name.replace('Jigsaw Toxic Comments', 'Jigsaw')
            .replace('OpenAI Moderation', 'OpenAI')
            .replace('PKU-SafeRLHF', 'SafeRLHF')
            .replace('NVIDIA Aegis v2', 'Aegis');

        // Dataset name
        ctx.fillStyle = '#333';
        ctx.font = '11px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(name, nameWidth - 8, y);

        // Exclusivity bar (0–1 scale, dark)
        var barW = avgExcl * (barAreaWidth - 10);
        ctx.fillStyle = '#333';
        ctx.fillRect(nameWidth, y - 5, barW, 10);

        // Multi-label rate indicator (light bar from left)
        var mlBarW = multiRate * (barAreaWidth - 10);
        ctx.fillStyle = '#ddd';
        ctx.fillRect(nameWidth, y + 6, mlBarW, 3);

        // Label
        ctx.fillStyle = '#666';
        ctx.font = '10px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'left';
        var exclPct = Math.round(avgExcl * 100);
        var mlPct = Math.round(multiRate * 100);
        var rowsStr = stats.totalRows > 9999 ? (stats.totalRows / 1000).toFixed(1) + 'k' : stats.totalRows.toLocaleString();
        ctx.fillText(exclPct + '% avg excl.  \u00B7  ' + mlPct + '% multi-label  \u00B7  ' + rowsStr + ' rows', nameWidth + barAreaWidth, y);
    });
}

/* ── 11. Co-occurrence Network Graph (Force-Directed) ── */

function drawCooccurrenceNetwork(canvas, pairCounts, singleCounts, keys, namesFn) {
    var n = keys.length;
    if (n < 2) { canvas.style.display = 'none'; return; }
    canvas.style.display = '';

    var W = 500, H = 400;
    var dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';

    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    // Find max single count for node sizing
    var maxSingle = 0;
    keys.forEach(function(k) {
        var c = singleCounts[k] || 0;
        if (c > maxSingle) maxSingle = c;
    });
    if (maxSingle === 0) maxSingle = 1;

    // Build edges with weights
    var edges = [];
    var maxWeight = 0;
    for (var i = 0; i < n; i++) {
        for (var j = i + 1; j < n; j++) {
            var pair = keys[i] + '+' + keys[j];
            var w = pairCounts[pair] || 0;
            if (w > 0) {
                edges.push({ i: i, j: j, w: w });
                if (w > maxWeight) maxWeight = w;
            }
        }
    }
    if (maxWeight === 0) maxWeight = 1;

    // Filter to above-median edges to avoid hairball
    var weights = edges.map(function(e) { return e.w; }).sort(function(a, b) { return a - b; });
    var medianW = weights.length > 0 ? weights[Math.floor(weights.length / 2)] : 0;
    var visibleEdges = edges.filter(function(e) { return e.w >= medianW; });

    // Initialize nodes in circular layout
    var cx = W / 2, cy = H / 2;
    var layoutR = Math.min(W, H) * 0.35;
    var nodes = keys.map(function(k, idx) {
        var angle = (2 * Math.PI * idx) / n - Math.PI / 2;
        return {
            x: cx + layoutR * Math.cos(angle),
            y: cy + layoutR * Math.sin(angle),
            vx: 0, vy: 0,
            r: 4 + 10 * ((singleCounts[k] || 0) / maxSingle)
        };
    });

    // Simple force simulation: 150 iterations
    for (var iter = 0; iter < 150; iter++) {
        var alpha = 1 - iter / 150;
        // Coulomb repulsion
        for (var a = 0; a < n; a++) {
            for (var b = a + 1; b < n; b++) {
                var dx = nodes[b].x - nodes[a].x;
                var dy = nodes[b].y - nodes[a].y;
                var dist = Math.sqrt(dx * dx + dy * dy) || 1;
                var force = 800 * alpha / (dist * dist);
                var fx = dx / dist * force;
                var fy = dy / dist * force;
                nodes[a].vx -= fx; nodes[a].vy -= fy;
                nodes[b].vx += fx; nodes[b].vy += fy;
            }
        }
        // Hooke attraction (edges)
        visibleEdges.forEach(function(e) {
            var na = nodes[e.i], nb = nodes[e.j];
            var dx = nb.x - na.x;
            var dy = nb.y - na.y;
            var dist = Math.sqrt(dx * dx + dy * dy) || 1;
            var strength = 0.05 * alpha * (e.w / maxWeight);
            var fx = dx * strength;
            var fy = dy * strength;
            na.vx += fx; na.vy += fy;
            nb.vx -= fx; nb.vy -= fy;
        });
        // Center gravity
        for (var c = 0; c < n; c++) {
            nodes[c].vx += (cx - nodes[c].x) * 0.01 * alpha;
            nodes[c].vy += (cy - nodes[c].y) * 0.01 * alpha;
        }
        // Apply velocity
        for (var d = 0; d < n; d++) {
            nodes[d].x += nodes[d].vx * 0.3;
            nodes[d].y += nodes[d].vy * 0.3;
            nodes[d].vx *= 0.8;
            nodes[d].vy *= 0.8;
            // Clamp to canvas bounds
            var pad = nodes[d].r + 20;
            nodes[d].x = Math.max(pad, Math.min(W - pad, nodes[d].x));
            nodes[d].y = Math.max(pad, Math.min(H - pad, nodes[d].y));
        }
    }

    // Draw edges
    visibleEdges.forEach(function(e) {
        var na = nodes[e.i], nb = nodes[e.j];
        var intensity = e.w / maxWeight;
        var gray = Math.round(200 - intensity * 160);
        ctx.strokeStyle = 'rgb(' + gray + ',' + gray + ',' + gray + ')';
        ctx.lineWidth = 0.5 + intensity * 2.5;
        ctx.beginPath();
        ctx.moveTo(na.x, na.y);
        ctx.lineTo(nb.x, nb.y);
        ctx.stroke();
    });

    // Draw nodes
    for (var ni = 0; ni < n; ni++) {
        var nd = nodes[ni];
        ctx.fillStyle = '#444';
        ctx.beginPath();
        ctx.arc(nd.x, nd.y, nd.r, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw labels
    var fontSize = n > 16 ? 8 : 10;
    ctx.font = fontSize + 'px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = '#222';
    for (var li = 0; li < n; li++) {
        var lnd = nodes[li];
        var label = namesFn ? namesFn(keys[li]) : keys[li];
        if (label.length > 14) label = label.slice(0, 13) + '\u2026';
        ctx.fillText(label, lnd.x, lnd.y - lnd.r - 2);
    }
}

/* ── 12. Concept Comparison (Grouped Bars) ── */

function drawConceptComparison(canvas, datasets) {
    // datasets: [{name, flaggedPct, exclusivityRatio, catNames}]
    if (!datasets || !datasets.length) { canvas.style.display = 'none'; return; }
    canvas.style.display = '';

    var n = datasets.length;
    var rowHeight = 36;
    var nameWidth = 100;
    var barAreaWidth = 250;
    var labelWidth = 200;
    var totalWidth = nameWidth + barAreaWidth + labelWidth;
    var totalHeight = n * rowHeight + 4;

    var dpr = window.devicePixelRatio || 1;
    canvas.width = totalWidth * dpr;
    canvas.height = totalHeight * dpr;
    canvas.style.width = totalWidth + 'px';
    canvas.style.height = totalHeight + 'px';

    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, totalWidth, totalHeight);

    datasets.forEach(function(ds, i) {
        var y = i * rowHeight + rowHeight / 2 + 2;

        // Dataset name
        ctx.fillStyle = '#333';
        ctx.font = '11px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(ds.name, nameWidth - 8, y);

        // Flagged % bar (dark)
        var flaggedW = ds.flaggedPct * (barAreaWidth - 10);
        ctx.fillStyle = '#333';
        ctx.fillRect(nameWidth, y - 7, flaggedW, 8);

        // Exclusivity ratio bar (light, below)
        var exclW = ds.exclusivityRatio * (barAreaWidth - 10);
        ctx.fillStyle = '#bbb';
        ctx.fillRect(nameWidth, y + 2, exclW, 5);

        // Labels
        ctx.fillStyle = '#666';
        ctx.font = '10px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'left';
        var flagPct = Math.round(ds.flaggedPct * 100);
        var exclPct = Math.round(ds.exclusivityRatio * 100);
        ctx.fillText(flagPct + '% flagged  \u00B7  ' + exclPct + '% exclusive  \u00B7  ' + ds.catNames, nameWidth + barAreaWidth, y);
    });
}

/* ── 13. Doppelganger: Cross-Dataset Match Panel (DOM) ── */

function renderCrossDatasetMatch(container, xrefEntry, registry) {
    container.innerHTML = '';
    if (!xrefEntry || !xrefEntry.matches) return;

    // Build dataset name lookup
    var dsNames = {};
    if (registry && registry.datasets) {
        registry.datasets.forEach(function(ds) { dsNames[ds.id] = ds.name; });
    }

    // Build category name lookup per dataset
    var catNames = {};
    if (registry && registry.datasets) {
        registry.datasets.forEach(function(ds) {
            var map = {};
            ds.categories.forEach(function(c) { map[c.key] = c.short || c.name; });
            catNames[ds.id] = map;
        });
    }

    // Prompt text (truncated)
    var promptP = document.createElement('p');
    promptP.style.cssText = 'font-size:0.9em;color:#333;margin-bottom:0.5rem;';
    var promptText = xrefEntry.prompt;
    if (promptText.length > 200) promptText = promptText.slice(0, 200) + '\u2026';
    promptP.textContent = '\u201C' + promptText + '\u201D';
    container.appendChild(promptP);

    // Per-dataset rows
    xrefEntry.matches.forEach(function(m) {
        var row = document.createElement('div');
        row.style.cssText = 'margin:0.25rem 0;font-size:0.85em;';

        var dsSpan = document.createElement('span');
        dsSpan.style.cssText = 'font-weight:600;color:#555;margin-right:0.5rem;font-family:system-ui,-apple-system,sans-serif;';
        dsSpan.textContent = dsNames[m.dataset] || m.dataset;
        row.appendChild(dsSpan);

        var dsMap = catNames[m.dataset] || {};
        m.cats.forEach(function(catKey) {
            var pill = document.createElement('span');
            pill.className = 'pill-sm';
            pill.textContent = dsMap[catKey] || catKey;
            row.appendChild(pill);
        });

        container.appendChild(row);
    });
}

/* ── 13. Consensus: Agreement Summary (Canvas) ── */

function drawAgreementSummary(canvas, data, namesFn) {
    if (!data || !data.length) {
        canvas.style.display = 'none';
        return;
    }
    canvas.style.display = '';

    var n = data.length;
    var rowHeight = n > 16 ? 20 : 24;
    var nameWidth = 140;
    var barAreaWidth = 200;
    var labelWidth = 140;
    var totalWidth = nameWidth + barAreaWidth + labelWidth;
    var totalHeight = n * rowHeight + 4;

    var dpr = window.devicePixelRatio || 1;
    canvas.width = totalWidth * dpr;
    canvas.height = totalHeight * dpr;
    canvas.style.width = totalWidth + 'px';
    canvas.style.height = totalHeight + 'px';

    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, totalWidth, totalHeight);

    var fontSize = n > 16 ? 9 : 10;

    data.forEach(function(item, i) {
        var y = i * rowHeight + rowHeight / 2 + 2;
        var name = namesFn ? namesFn(item.key) : item.key;

        // Name label
        ctx.fillStyle = '#333';
        ctx.font = fontSize + 'px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        var maxNameLen = 18;
        ctx.fillText(name.length > maxNameLen ? name.slice(0, maxNameLen - 1) + '\u2026' : name, nameWidth - 8, y);

        var total = item.agree + item.disagree;
        if (total === 0) return;

        var agreeRate = item.agree / total;

        // Agreement bar (dark)
        var agreeW = agreeRate * (barAreaWidth - 10);
        ctx.fillStyle = '#333';
        ctx.fillRect(nameWidth, y - 5, agreeW, 10);

        // Disagreement bar (light)
        var disagreeW = (1 - agreeRate) * (barAreaWidth - 10);
        ctx.fillStyle = '#ccc';
        ctx.fillRect(nameWidth + agreeW, y - 5, disagreeW, 10);

        // Label
        ctx.fillStyle = '#666';
        ctx.font = fontSize + 'px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(Math.round(agreeRate * 100) + '% agree  (' + total + ' shared)', nameWidth + barAreaWidth, y);
    });
}
