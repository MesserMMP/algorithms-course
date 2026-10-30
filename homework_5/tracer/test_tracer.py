import unittest
from homework_5.tracer.tracer import tracer

class Tests(unittest.TestCase):
    def test_trace_and_metadata(self):
        lines, events = [], []
        @tracer(emit=lines.append, on_event=events.append)
        def fact(n):
            "factorial"
            return 1 if n == 0 else n * fact(n-1)
        self.assertEqual(fact(3), 6)
        self.assertEqual([e['depth'] for e in events], [0,1,2,3,3,2,1,0])
        self.assertEqual(lines[3], '      → fact(0)')
        self.assertEqual(lines[-1], '← fact = 6')
        self.assertEqual(fact.__name__, 'fact')
        self.assertEqual(fact.__doc__, 'factorial')
    def test_exception_and_reset(self):
        events=[]
        @tracer(emit=None, on_event=events.append)
        def f(n=0):
            if n: return f(n-1)
            raise RuntimeError('failure')
        with self.assertRaises(RuntimeError): f(2)
        with self.assertRaises(RuntimeError): f(n=0)
        self.assertEqual(events[-2]['depth'],0)
        self.assertEqual(events[-1]['kind'],'error')
    def test_nested_functions_and_none(self):
        events=[]
        @tracer(emit=None,on_event=events.append)
        def a(): return b()
        @tracer(emit=None,on_event=events.append)
        def b(): return None
        self.assertIsNone(a())
        self.assertEqual([e['depth'] for e in events],[0,1,1,0])
    def test_callback_failure_resets_depth(self):
        def fail(e):
            if e['kind']=='return': raise ValueError('sink')
        @tracer(emit=None,on_event=fail)
        def f(): return 1
        with self.assertRaises(ValueError): f()
        events=[]
        tracer(lambda: 1,emit=None,on_event=events.append)()
        self.assertEqual(events[0]['depth'],0)
