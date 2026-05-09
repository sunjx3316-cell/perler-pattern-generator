import os

def read_file(path):
    encodings = ['utf-8', 'utf-16', 'gbk', 'utf-8-sig']
    for enc in encodings:
        try:
            with open(path, 'r', encoding=enc) as f:
                return f.read()
        except UnicodeDecodeError:
            continue
    raise ValueError(f"Could not decode {path}")

def main():
    print("Reading files...")
    html = read_file('index.html')
    css = read_file('style.css')
    colors = read_file('colors.js')
    app = read_file('app.js')

    # Add Error Handler for Mobile Debugging
    error_handler = """
    <script>
    window.onerror = function(msg, url, line, col, error) {
        // Ignore ResizeObserver loop limit exceeded
        if (msg.includes('ResizeObserver')) return false;
        alert("Error: " + msg + "\\nLine: " + line);
        return false;
    };
    </script>
    """
    if '<head>' in html:
        html = html.replace('<head>', '<head>' + error_handler)

    print("Embedding resources...")
    
    # Replace CDN links with more stable ones for China/Mobile
    if 'cdnjs.cloudflare.com/ajax/libs/jspdf' in html:
        print("Replacing jsPDF CDN with BootCDN...")
        html = html.replace(
            'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
            'https://cdn.bootcdn.net/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
        )

    # Embed CSS
    if '<link rel="stylesheet" href="style.css">' in html:
        html = html.replace('<link rel="stylesheet" href="style.css">', f'<style>\n{css}\n</style>')
    else:
        print("Warning: style.css link not found in index.html")

    # Embed Colors JS
    if '<script src="colors.js"></script>' in html:
        html = html.replace('<script src="colors.js"></script>', f'<script>\n{colors}\n</script>')
    else:
        print("Warning: colors.js script tag not found in index.html")

    # Embed App JS
    if '<script src="app.js"></script>' in html:
        html = html.replace('<script src="app.js"></script>', f'<script>\n{app}\n</script>')
    else:
        print("Warning: app.js script tag not found in index.html")

    print("Writing dist.html...")
    with open('dist.html', 'w', encoding='utf-8') as f:
        f.write(html)
    
    print("Build complete: dist.html")

if __name__ == '__main__':
    main()
