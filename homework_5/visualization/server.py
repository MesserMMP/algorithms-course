"""Local visualizer API and static server; standard library only."""
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse
from homework_5.tracer.tracer import tracer
from homework_5.permutations.permutations import permutations
from homework_5.AVL.avl import AVL


def generate(data):
    task = data.get("task")
    frames, stack, output = [], [], []
    def record(event):
        e = dict(event)
        if e["kind"] == "call":
            stack.append(dict(name=e["function"], args=e["args"]))
            if task == "permutations" and not e["args"][1]:
                output.append(e["args"][0][:])
        frames.append(dict(**e, stack=list(stack), output=list(output)))
        if e["kind"] in ("return", "error"):
            stack.pop()
    if task == "tracer":
        n = data.get("n", 5)
        if type(n) is not int or not 0 <= n <= 8:
            raise ValueError("n: целое число от 0 до 8")
        mode = data.get("mode", "factorial")
        @tracer(emit=None, on_event=record)
        def factorial(n):
            return 1 if n <= 1 else n * factorial(n - 1)
        @tracer(emit=None, on_event=record)
        def fibonacci(n):
            return n if n <= 1 else fibonacci(n - 1) + fibonacci(n - 2)
        result = fibonacci(n) if mode == "fibonacci" else factorial(n)
    elif task == "permutations":
        nums = data.get("nums", [1, 2, 3])
        if not isinstance(nums, list) or len(nums) > 5 or any(type(x) is not int or abs(x) > 999 for x in nums):
            raise ValueError("Массив: до 5 целых чисел от −999 до 999")
        result = permutations(nums, on_event=record)
    elif task == "avl":
        ops = data.get("ops", [])
        if not isinstance(ops, list) or len(ops) > 25:
            raise ValueError("Не более 25 операций")
        def capture(e):
            frames.append(dict(**e, operation=current, stack=[], output=[]))
        tree = AVL(on_event=capture)
        for op in ops:
            if not isinstance(op, list) or len(op) != 2 or op[0] not in ("insert", "delete", "search") or type(op[1]) is not int or abs(op[1]) > 999:
                raise ValueError("Операции: insert/delete/search и целое число от −999 до 999")
            current = f"{op[0]} {op[1]}"
            getattr(tree, op[0])(op[1])
        result = tree.inorder()
    else:
        raise ValueError("Неизвестная задача")
    return dict(frames=frames, result=result)


class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != "/api/trace":
            self.send_error(404); return
        try:
            size = int(self.headers.get("Content-Length", 0))
            if not 0 < size <= 10000:
                raise ValueError("Некорректный размер запроса")
            data = json.loads(self.rfile.read(size))
            if not isinstance(data, dict):
                raise ValueError("Ожидается JSON-объект")
            body = json.dumps(generate(data), ensure_ascii=False).encode()
            status = 200
        except (ValueError, TypeError) as error:
            status, body = 400, json.dumps(dict(error=str(error)), ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers(); self.wfile.write(body)

    def do_GET(self):
        root = Path(__file__).parent / "dist"
        route = urlparse(self.path).path.removeprefix("/visualization").lstrip("/")
        file = (root / (route or "index.html")).resolve()
        if not file.is_relative_to(root.resolve()) or not file.is_file():
            self.send_error(404); return
        import mimetypes
        body = file.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", mimetypes.guess_type(file)[0] or "application/octet-stream")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers(); self.wfile.write(body)


if __name__ == "__main__":
    ThreadingHTTPServer(("0.0.0.0", 8085), Handler).serve_forever()
