from ortools.sat.python import cp_model


def test_cp_sat_runtime_solves_a_prerequisite_order():
    model = cp_model.CpModel()
    prerequisite_term = model.new_int_var(1, 3, "prerequisite_term")
    dependent_term = model.new_int_var(1, 3, "dependent_term")
    model.add(dependent_term > prerequisite_term)
    model.minimize(dependent_term)
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 3
    status = solver.solve(model)
    assert status == cp_model.OPTIMAL
    assert solver.value(prerequisite_term) == 1
    assert solver.value(dependent_term) == 2
