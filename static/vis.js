/**
 * vis.js — Pure-canvas Tufte-inspired visualizations for explore-wrongthink
 *
 * Seven visualizations, zero external dependencies:
 *   1. drawCategoryStrip             — Small multiples for category counts (clickable)
 *   2. drawCooccurrenceMatrix        — Grayscale co-occurrence heatmap (clickable)
 *   3. renderWordFrequencyStrip      — Ranked dot plot of word frequencies
 *   4. drawCombinationDotPlot        — Horizontal dot plot of category combos
 *   5. renderWordCategoryBreakdown   — Category breakdown for a clicked word (proportion bars)
 *   6. drawExclusivityChart          — Exclusive vs shared stacked bars per category
 *   7. drawBinaryBitmap              — Dense binary data matrix (prompt × category)
 *
 * All functions adapt to variable numbers of categories (8, 12, 14, 23).
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
