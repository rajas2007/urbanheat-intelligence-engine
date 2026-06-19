import re
with open('c:/Users/ghong/OneDrive/Attachments/Desktop/urbanheat-intelligence-engine/backend/heatmap/areas_config.py', 'r') as f:
    content = f.read()

count = 1
def repl(m):
    global count
    res = '{"id": ' + str(count) + ', ' + m.group(1)
    count += 1
    return res

new_content = re.sub(r'\{("name":)', repl, content)

with open('c:/Users/ghong/OneDrive/Attachments/Desktop/urbanheat-intelligence-engine/backend/heatmap/areas_config.py', 'w') as f:
    f.write(new_content)
