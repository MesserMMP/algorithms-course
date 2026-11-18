"""Serve the TypeScript application and events from the homework solutions."""

import json
import mimetypes
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from random import Random
from threading import Lock
from urllib.parse import urlsplit

from homework_6.compare import sorts as recursive
from homework_6.compare.benchmark import run_benchmark
from homework_6.iterative import sorts as iterative
from homework_6.kth.quickselect import kth_largest


DIST = Path(__file__).resolve().parent / "dist"
BENCH_LOCK = Lock()
SORTS = {
    ("compare", "merge"): recursive.mergesort,
    ("compare", "quick"): recursive.quicksort,
    ("iterative", "merge"): iterative.mergesort,
    ("iterative", "quick"): iterative.quicksort,
}


def trace(data):
    values = data.get("values")
    if not isinstance(values, list) or len(values) > 16:
        raise ValueError("Введите массив длиной до 16 элементов.")
    if any(type(v) is not int or abs(v) > 999 for v in values):
        raise ValueError("Допустимы целые числа от −999 до 999.")
    task, algorithm = data.get("task"), data.get("algorithm")
    frames = []
    if task == "kth" and algorithm == "select":
        k = data.get("k")
        if type(k) is not int or not 1 <= k <= len(values):
            raise ValueError("k должно быть целым числом от 1 до длины массива.")
        result = kth_largest(values, k, on_event=frames.append, rng=Random(42))
    else:
        if not isinstance(task, str) or not isinstance(algorithm, str) or (task, algorithm) not in SORTS:
            raise ValueError("Неизвестный алгоритм.")
        result = SORTS[task, algorithm](values, on_event=frames.append)
    return {"frames": frames, "result": result}


class Handler(BaseHTTPRequestHandler):
    def reply(self, status, body, content_type="application/json; charset=utf-8"):
        if not isinstance(body, bytes):
            body = json.dumps(body, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        try:
            if self.path not in ("/api/trace", "/api/benchmark"):
                self.send_error(404)
                return
            length = int(self.headers.get("Content-Length", "0"))
            if not 0 < length <= 4096:
                raise ValueError("Некорректный размер запроса.")
            data = json.loads(self.rfile.read(length))
            if not isinstance(data, dict):
                raise ValueError("Ожидается объект JSON.")
            if self.path == "/api/trace":
                payload = trace(data)
            elif BENCH_LOCK.acquire(blocking=False):
                try:
                    payload = run_benchmark()
                finally:
                    BENCH_LOCK.release()
            else:
                self.reply(409, {"error": "Замер уже выполняется. Повторите чуть позже."})
                return
        except (ValueError, TypeError) as error:
            self.reply(400, {"error": str(error)})
            return
        self.reply(200, payload)

    def do_GET(self):
        route = urlsplit(self.path).path.removeprefix("/visualization/").lstrip("/")
        file = (DIST / (route or "index.html")).resolve()
        if not file.is_relative_to(DIST) or not file.is_file():
            self.send_error(404)
            return
        self.reply(200, file.read_bytes(), mimetypes.guess_type(file.name)[0] or "application/octet-stream")


if __name__ == "__main__":
    ThreadingHTTPServer(("0.0.0.0", 8086), Handler).serve_forever()
