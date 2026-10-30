import itertools
import unittest
from homework_5.permutations.permutations import permutations

class Tests(unittest.TestCase):
    def test_examples_and_edges(self):
        for values in ([],[1],[0,1],[1,2,3],[1,1,2],[-1,0,1],[2,2,2]):
            original=values[:]
            actual=permutations(values)
            expected=set(itertools.permutations(values))
            self.assertEqual(set(map(tuple,actual)),expected)
            self.assertEqual(len(actual),len(expected))
            self.assertEqual(values,original)
    def test_exhaustive(self):
        for n in range(6):
            for values in itertools.product(range(2),repeat=n):
                self.assertEqual(set(map(tuple,permutations(values))),set(itertools.permutations(values)))
    def test_independent_results_and_trace(self):
        events=[]
        result=permutations([1,2,3],on_event=events.append)
        self.assertEqual(len(result),6)
        result[0][0]=99
        self.assertNotIn(99,result[1])
        self.assertEqual(events[0]['kind'],'call')
        self.assertEqual(events[-1]['result'],6)
        self.assertEqual(sum(e['kind']=='call' for e in events),sum(e['kind']=='return' for e in events))
