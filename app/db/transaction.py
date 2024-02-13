from app.middleware.requestvars import g


def transaction(func):
    def wrapper(*args, **kwargs):
        db = g().db

        if hasattr(g(), 'transaction_started') and g().transaction_started:
            result = func(*args, **kwargs)
            db.flush()
            return result

        g().transaction_started = True
        try:
            result = func(*args, **kwargs)
            db.flush()
            db.commit()
        except Exception as e:
            db.rollback()
            raise e
        finally:
            g().transaction_started = False
        return result

    return wrapper
