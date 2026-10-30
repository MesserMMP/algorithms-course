"""Synchronous recursive call tracing; independent depth per execution context."""
from contextvars import ContextVar
from functools import wraps

_depth = ContextVar("trace_depth", default=0)


def tracer(function=None, *, emit=print, on_event=None):
    """Use @tracer or @tracer(emit=None, on_event=callback).

    emit receives readable lines; on_event receives structured dictionaries.
    Function return values and exceptions are preserved. Callback failures propagate.
    """
    def decorate(fn):
        @wraps(fn)
        def wrapped(*args, **kwargs):
            depth = _depth.get()
            def report(kind, **fields):
                event = dict(kind=kind, function=fn.__name__, depth=depth, **fields)
                if emit is not None:
                    if kind == "call":
                        content = ", ".join([*(repr(x) for x in args), *(f"{k}={v!r}" for k, v in kwargs.items())])
                        text = f"→ {fn.__name__}({content})"
                    elif kind == "return":
                        text = f"← {fn.__name__} = {fields['result']!r}"
                    else:
                        text = f"! {fn.__name__}: {fields['error']}"
                    emit("  " * depth + text)
                if on_event is not None:
                    on_event(event)
            report("call", args=args, kwargs=kwargs)
            token = _depth.set(depth + 1)
            try:
                try:
                    result = fn(*args, **kwargs)
                except BaseException as error:
                    report("error", error=f"{type(error).__name__}: {error}")
                    raise
                report("return", result=result)
                return result
            finally:
                _depth.reset(token)
        return wrapped
    return decorate(function) if function is not None else decorate
