import unittest
from homework_5.visualization.server import generate

class Tests(unittest.TestCase):
    def test_real_results_and_stack(self):
        factorial=generate(dict(task='tracer',n=6))
        self.assertEqual(factorial['result'],720)
        self.assertEqual(len(factorial['frames'][-1]['stack']),1)
        self.assertEqual(generate(dict(task='tracer',mode='fibonacci',n=4))['result'],3)
        p=generate(dict(task='permutations',nums=[1,2,3]))
        self.assertEqual(len(p['result']),6)
        self.assertEqual(p['frames'][-1]['output'],p['result'])
        a=generate(dict(task='avl',ops=[['insert',30],['insert',10],['insert',20],['delete',10],['search',20]]))
        self.assertEqual(a['result'],[20,30])
        self.assertEqual(sum(f['kind']=='rotation_after' for f in a['frames']),2)
        self.assertEqual(a['frames'][-1]['kind'],'found')
    def test_limits(self):
        for data in [dict(task='tracer',n=-1),dict(task='tracer',n=True),dict(task='permutations',nums=list(range(6))),dict(task='avl',ops=[['bad',1]]),dict(task='avl',ops=[['insert',True]]),dict(task='bad')]:
            with self.assertRaises(ValueError): generate(data)
